<?php
declare(strict_types=1);

// 原始檔與衍生圖先留在私有目錄；只有發布引用的衍生圖會複製到公開區。
function asset_path(string $assetId, string $variant): string {
    global $privateDir;
    if (!preg_match('/^[a-f0-9]{32}$/D',$assetId) || !in_array($variant,['original','cover','display'],true)) fail(404,'找不到圖片。');
    return $privateDir . '/assets/' . $assetId . ($variant==='original' ? '.original' : '-' . $variant . '.webp');
}
function upload_image(string $projectId, string $mode): array {
    if (!in_array($mode,['photo','design'],true)) fail(422,'圖片處理模式不正確。');
    $file = $_FILES['image'] ?? null;
    if($file && in_array($file['error'],[UPLOAD_ERR_INI_SIZE,UPLOAD_ERR_FORM_SIZE],true)) fail(413,'目前每張上傳上限為 '.upload_limit_label().'，請先縮小圖片。');
    if (!$file || $file['error']!==UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])) fail(422,'圖片上傳失敗，請確認檔案與主機上傳限制。');
    $limits=upload_limits();
    if($file['size']>$limits['maxBytes']) fail(413,'目前每張上傳上限為 '.upload_limit_label().'，請先縮小圖片。');
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    $info = @getimagesize($file['tmp_name']);
    if (!$info || !in_array($mime,['image/jpeg','image/png','image/webp'],true) || $mime!==$info['mime']) fail(422,'請上傳 JPEG、PNG 或 WebP 圖片。');
    [$width,$height] = $info;
    if ($width<1 || $height<1 || $width*$height>40000000 || max($width,$height)>40000) fail(422,'圖片尺寸超過處理上限，請先縮小或分段。');
    if($width*$height>$limits['maxPixels']) fail(422,'圖片尺寸超過目前主機可處理的範圍，請讓瀏覽器縮小後再上傳。');
    $image = match($mime) {'image/jpeg'=>@imagecreatefromjpeg($file['tmp_name']),'image/png'=>@imagecreatefrompng($file['tmp_name']),'image/webp'=>@imagecreatefromwebp($file['tmp_name'])};
    if (!$image) fail(422,'無法讀取圖片內容。');
    $id = bin2hex(random_bytes(16)); $created = [];
    try {
        if ($mime==='image/jpeg') {
            $exif = @exif_read_data($file['tmp_name']);
            $orientation = (int)($exif['Orientation']??1);
            if (in_array($orientation,[2,4,5,7],true)) imageflip($image,IMG_FLIP_HORIZONTAL);
            $degrees = match($orientation) {3,4=>180,6,7=>-90,5,8=>90,default=>0};
            if ($degrees) { $rotated=imagerotate($image,$degrees,0); if (!$rotated) throw new RuntimeException('Rotate failed'); $image=$rotated; }
        }
        imagepalettetotruecolor($image); imagealphablending($image,false); imagesavealpha($image,true);
        $width=imagesx($image); $height=imagesy($image); $variants=[];
        foreach (['cover'=>[1200,250*1024],'display'=>[$mode==='design'?1800:2400,700*1024]] as $name=>[$target,$budget]) {
            // 設計長圖按寬度縮放，不裁切高度；一般照片另限制長邊。
            $scale = min(1,$target/$width,$mode==='photo' ? $target/$height : 1);
            $w=max(1,(int)round($width*$scale)); $h=max(1,(int)round($height*$scale));
            $out=imagecreatetruecolor($w,$h); imagealphablending($out,false); imagesavealpha($out,true);
            imagecopyresampled($out,$image,0,0,0,0,$w,$h,$width,$height);
            $path=asset_path($id,$name); $created[]=$path;
            foreach ($mode==='design'?[88,84,80]:[84,78,72,66] as $quality) {
                if (!imagewebp($out,$path,$quality)) throw new RuntimeException('Encode failed');
                clearstatcache(true,$path); if (filesize($path)<=$budget) break;
            }
            chmod($path,0600);
            $variants[$name]=['width'=>$w,'height'=>$h,'bytes'=>filesize($path),'targetBytes'=>$budget];
            imagedestroy($out);
        }
        $original=asset_path($id,'original'); $created[]=$original;
        if (!move_uploaded_file($file['tmp_name'],$original)) throw new RuntimeException('Upload failed');
        chmod($original,0600);
        $name=basename(str_replace('\\','/',(string)$file['name']));
        if (!preg_match('//u',$name)) $name='image';
        return ['id'=>$id,'projectId'=>$projectId,'originalName'=>preg_replace('/[\x00-\x1f]/u','',$name),'originalBytes'=>$file['size'],'mode'=>$mode,'variants'=>$variants];
    } catch (Throwable $error) { foreach ($created as $path) if (is_file($path)) unlink($path); throw $error; }
    finally { imagedestroy($image); }
}
function asset_url(array $asset, string $variant): string {
    global $uploadPrefix;
    return $uploadPrefix.'/' . substr(hash('sha256',$asset['projectId']),0,20) . '/' . $asset['id'] . '-' . $variant . '.webp';
}
function resolve_asset(string $ref, string $variant, array $state, bool $preview): string {
    if (!str_starts_with($ref,'asset:')) return $ref;
    $id=substr($ref,6); $asset=$state['assets'][$id]??null;
    if (!$asset) throw new RuntimeException('Missing asset');
    return $preview ? '/api/index.php?action=asset&asset='.$id.'&variant='.$variant : asset_url($asset,$variant);
}
function project_view(array $project, array $state, bool $preview=false): array {
    if (empty($project['detailImage']) && str_starts_with($project['image']??'','asset:')) { $project['detailImage']=$project['image']; $project['detailImageAlt']=$project['imageAlt']??''; }
    foreach (['image'=>'cover','detailImage'=>'display'] as $key=>$variant) if (!empty($project[$key])) $project[$key]=resolve_asset($project[$key],$variant,$state,$preview);
    foreach ($project['gallery']??[] as $i=>$item) $project['gallery'][$i]['src']=resolve_asset($item['src'],'display',$state,$preview);
    return $project;
}
function publish_assets(array $project, array $state): void {
    global $publicDir;
    $refs=[$project['image']??'', $project['detailImage']??'', ...array_column($project['gallery']??[],'src')];
    foreach (array_unique($refs) as $ref) {
        if (!str_starts_with($ref,'asset:')) continue;
        $asset=$state['assets'][substr($ref,6)]??null;
        if (!$asset || $asset['projectId']!==$project['id']) throw new RuntimeException('Invalid asset owner');
        foreach (['cover','display'] as $variant) {
            $dest=$publicDir.asset_url($asset,$variant); $dir=dirname($dest);
            if (!is_dir($dir) && !mkdir($dir,0755,true)) throw new RuntimeException('Public directory unavailable');
            // 只有重新編碼的 WebP 可進公開區，不沿用上傳檔名或副檔名。
            if (!is_file($dest)) {
                $temp=$dest.'.tmp-'.bin2hex(random_bytes(4));
                if (!copy(asset_path($asset['id'],$variant),$temp) || !rename($temp,$dest)) throw new RuntimeException('Publish image failed');
                chmod($dest,0644);
            }
        }
    }
}
