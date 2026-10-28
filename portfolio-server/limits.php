<?php
declare(strict_types=1);

// 使用主機實際上限，保留 multipart 與 GD 旋轉／縮圖所需空間。
function ini_bytes(string $value): int {
    $value = trim($value);
    if ($value === '-1') return -1;
    if (!preg_match('/^(\d+(?:\.\d+)?)\s*([KMG]?)$/iD', $value, $match)) return 0;
    return (int)floor((float)$match[1] * match(strtolower($match[2])) {'g'=>1073741824,'m'=>1048576,'k'=>1024,default=>1});
}
function upload_limits(): array {
    $upload=ini_bytes((string)ini_get('upload_max_filesize'));
    $post=ini_bytes((string)ini_get('post_max_size'));
    $memory=ini_bytes((string)ini_get('memory_limit'));
    $bytes=min(20*1024*1024, $upload>0?$upload:PHP_INT_MAX, $post>0?max(0,$post-65536):PHP_INT_MAX);
    $pixels=$memory>0 ? max(0,(int)floor(($memory-memory_get_usage(true)-32*1024*1024)/16)) : 40000000;
    return ['maxBytes'=>$bytes,'maxPixels'=>min(40000000,$pixels),'maxDimension'=>40000,'postBytes'=>$post,'memoryBytes'=>$memory];
}
function upload_limit_label(): string {
    return rtrim(rtrim(number_format(upload_limits()['maxBytes']/1048576,2,'.',''),'0'),'.').'MB';
}
