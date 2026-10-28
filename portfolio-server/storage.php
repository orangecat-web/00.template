<?php
declare(strict_types=1);

// 私有 JSON 使用獨立鎖檔與原子更名；草稿、公開版本與歷史一併提交。
function fail(int $status, string $message): never { throw new ApiError($message, $status); }
class ApiError extends RuntimeException {}
function json_read(string $path): array {
    $value = json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
    if (!is_array($value)) throw new RuntimeException('Invalid storage');
    return $value;
}
function atomic_json(string $path, array $value): void {
    $temp = tempnam(dirname($path), '.write-');
    if ($temp === false) throw new RuntimeException('Storage unavailable');
    try {
        chmod($temp, 0600);
        $handle = fopen($temp, 'wb');
        if (!$handle) throw new RuntimeException('Storage unavailable');
        try {
            $text = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
            if (fwrite($handle, $text) !== strlen($text) || !fflush($handle)) throw new RuntimeException('Write failed');
            if (function_exists('fsync')) fsync($handle);
        } finally { fclose($handle); }
        if (!rename($temp, $path)) throw new RuntimeException('Commit failed');
    } finally { if (is_file($temp)) unlink($temp); }
}
function store(callable $callback, bool $write = false): mixed {
    global $privateDir;
    $lock = fopen($privateDir . '/state.lock', 'c');
    if (!$lock || !flock($lock, $write ? LOCK_EX : LOCK_SH)) throw new RuntimeException('Lock failed');
    try {
        $state = json_read($privateDir . '/state.json');
        $result = $callback($state);
        if ($write) { $state['revision']++; atomic_json($privateDir . '/state.json', $state); }
        return $result;
    } finally { flock($lock, LOCK_UN); fclose($lock); }
}
function check_version(array $state, string $id, mixed $version): void {
    if (!is_int($version) || ($state['versions'][$id] ?? -1) !== $version) fail(409, '作品已在其他視窗更新，請重新載入後再編輯。');
}
function snapshot(array &$state): void {
    array_unshift($state['history'], ['id' => bin2hex(random_bytes(12)), 'at' => gmdate('c'), 'projects' => $state['published']]);
    $state['history'] = array_slice($state['history'], 0, 20);
}
function find_project(array $state, string $id): ?array {
    if (isset($state['drafts'][$id])) return $state['drafts'][$id]['project'];
    foreach ($state['published'] as $project) if ($project['id'] === $id) return $project;
    return null;
}
function record(array $state, string $id): array {
    $project = find_project($state, $id);
    if (!$project) fail(404, '找不到作品。');
    return ['project' => $project, 'version' => $state['versions'][$id], 'hasDraft' => isset($state['drafts'][$id]), 'published' => in_array($id, array_column($state['published'], 'id'), true), 'reviewed' => ($state['drafts'][$id]['reviewed'] ?? -1) === $state['versions'][$id]];
}
