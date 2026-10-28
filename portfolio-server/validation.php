<?php
declare(strict_types=1);

// 僅接受既定欄位；文字交給 Vue 插值顯示，網址與圖片引用由後端驗證。
function text_field(array $data, string $key, int $max, string $default = ''): string {
    $value = $data[$key] ?? $default;
    if (!is_string($value) || strlen($value) > $max || !preg_match('//u', $value)) fail(422, (['title'=>'作品名稱','summary'=>'作品簡介','role'=>'負責項目','category'=>'類型文字','imageAlt'=>'封面替代文字','detailImageAlt'=>'主圖替代文字','externalUrl'=>'展示網址','externalLabel'=>'按鈕文字','heading'=>'小標題','body'=>'內文','alt'=>'替代文字','setupCode'=>'安裝碼','username'=>'帳號'][$key]??'內容').'格式或長度不正確。');
    return trim($value);
}
function image_ref(mixed $value, array $state, string $id): string {
    if ($value === null || $value === '') return '';
    if (!is_string($value)) fail(422, '圖片格式不正確。');
    if (preg_match('/^asset:([a-f0-9]{32})$/D', $value, $match)) {
        if (($state['assets'][$match[1]]['projectId'] ?? null) !== $id) fail(422, '圖片不屬於這件作品。');
        return $value;
    }
    if (strlen($value) > 600 || !str_starts_with($value, '/images/') || str_contains($value, '..') || preg_match('/[\x00-\x20\\\\?#]/', $value)) fail(422, '請選擇已上傳的圖片。');
    return $value;
}
function normalize_project(array $data, array $state, string $id, bool $publishing = false): array {
    global $organization;
    $categories = $data['categoryIds'] ?? [];
    if (!is_array($categories) || !array_is_list($categories) || count($categories)>4 || array_filter($categories,fn($v)=>!is_string($v)) || array_diff($categories, ['web','graphic','product-photo','frontend'])) fail(422, '作品分類不正確。');
    $project = ['id' => $id, 'categoryIds' => array_values(array_unique($categories))];
    foreach (['title'=>300,'summary'=>15000,'role'=>2000,'category'=>300,'imageAlt'=>1500,'detailImageAlt'=>1500,'externalLabel'=>150,'cover'=>80,'githubRepository'=>100] as $key=>$max) $project[$key] = text_field($data, $key, $max, $key === 'cover' ? 'web-design' : '');
    if (!preg_match('/^[a-z0-9-]{1,80}$/D', $project['cover'])) fail(422, '封面樣式不正確。');
    if ($project['githubRepository'] !== '' && !preg_match('/^[A-Za-z0-9_.-]{1,100}$/D', $project['githubRepository'])) fail(422, 'GitHub 倉庫名稱不正確。');
    if ($project['githubRepository'] !== '') $project['githubUrl'] = 'https://github.com/' . $organization . '/' . rawurlencode($project['githubRepository']);
    $url = text_field($data, 'externalUrl', 2000);
    if ($url !== '' && (preg_match('/[\x00-\x20\\\\]/', $url) || !(preg_match('~^https?://[^/]+~i', $url) || (str_starts_with($url, '/') && !str_starts_with($url, '//'))))) fail(422, '展示網址必須是 HTTP(S) 或站內路徑。');
    $project['externalUrl'] = $url;
    if ($url !== '' && $project['externalLabel'] === '') $project['externalLabel'] = '查看上線網站';
    foreach (['image','detailImage'] as $key) $project[$key] = image_ref($data[$key] ?? '', $state, $id);
    foreach (['sortOrder','featuredOrder'] as $key) {
        $value = $data[$key] ?? 0;
        if (!is_int($value) || $value < 0 || $value > 100000) fail(422, '排序必須是 0–100000 的整數。');
        $project[$key] = $value;
    }
    if (isset($data['featured']) && !is_bool($data['featured'])) fail(422, '精選設定不正確。');
    $project['featured'] = $data['featured'] ?? false;
    $tags = $data['techTags'] ?? [];
    if (!is_array($tags) || !array_is_list($tags) || count($tags)>25) fail(422, '技術標籤最多 25 個。');
    foreach ($tags as $tag) if (!is_string($tag) || strlen($tag)>150) fail(422, '技術標籤格式不正確。');
    $project['techTags'] = array_values(array_filter(array_map('trim', $tags)));
    $project['caseStudy'] = [];
    $notes = $data['caseStudy'] ?? [];
    if (!is_array($notes) || !array_is_list($notes) || count($notes)>30) fail(422, '作品思路格式不正確。');
    foreach ($notes as $note) {
        if (!is_array($note)) fail(422, '作品思路格式不正確。');
        $project['caseStudy'][] = ['heading'=>text_field($note,'heading',300), 'body'=>text_field($note,'body',15000)];
    }
    $gallery = $data['gallery'] ?? [];
    if (!is_array($gallery) || !array_is_list($gallery) || count($gallery)>100) fail(422, '作品圖最多 100 張。');
    $project['gallery'] = [];
    foreach ($gallery as $item) {
        if (!is_array($item)) fail(422, '作品圖格式不正確。');
        $src = $item['src'] ?? '';
        // 舊作品的相對檔名繼續支援；新圖片使用私有的 asset 引用。
        if (is_string($src) && preg_match('/^[^\/\\\\\x00-\x1f?#]{1,250}$/uD', $src) && !str_starts_with($src,'asset:') && !in_array($src, ['.','..'], true)) $source = $src;
        else $source = image_ref($src, $state, $id);
        $project['gallery'][] = ['src'=>$source, 'title'=>text_field($item,'title',300), 'alt'=>text_field($item,'alt',1500), 'wide'=>($item['wide'] ?? false) === true];
    }
    if ($publishing) {
        foreach (['title'=>'作品名稱','summary'=>'作品簡介','role'=>'負責項目','category'=>'類型文字'] as $key=>$label) if ($project[$key] === '') fail(422, '發布前請填寫'.$label.'。');
        if (!$categories) fail(422, '發布前請選擇作品分類。');
        foreach (['image','detailImage'] as $key) if ($project[$key] !== '' && $project[$key.'Alt'] === '') fail(422, '請填寫圖片替代文字。');
        foreach ($project['caseStudy'] as $note) if ($note['heading']==='' || $note['body']==='') fail(422, '作品思路的小標題與內文不能空白。');
        foreach ($project['gallery'] as $item) if ($item['src']==='' || $item['title']==='' || $item['alt']==='') fail(422, '作品圖需要圖片、標題及替代文字。');
        if ($gallery && $project['image']==='' && $project['detailImage']==='') fail(422, '有作品圖時請先設定封面或內頁主圖。');
        $others = array_filter($state['published'], fn($p) => $p['id']!==$id && ($p['featured']??false));
        if ($project['featured'] && count($others)>=3) fail(422, '首頁最多三件精選作品，請先取消其他作品的精選。');
    }
    return $project;
}
