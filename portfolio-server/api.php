<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
try {
    if (!configured() && !setup_pending()) fail(503,'作品管理服務尚未完成安裝，請確認安裝包的私有資料夾位置。');
    $action=$_GET['action']??'';
    if (!is_string($action)) fail(400,'操作格式不正確。');
    if ($action==='portfolio') {
        if ($_SERVER['REQUEST_METHOD']!=='GET') fail(405,'此操作需要 GET。');
        json_response(store(fn($s)=>['revision'=>$s['revision'],'projects'=>array_map(fn($p)=>project_view($p,$s),$s['published'])]));
    }
    start_session();
    if ($action==='session' && $_SERVER['REQUEST_METHOD']==='GET') json_response(['authenticated'=>authenticated(),'setupRequired'=>setup_pending(),'csrf'=>$_SESSION['csrf']]);
    if ($action==='setup') { require_post(); initialize_admin(request_body()); json_response(['authenticated'=>true,'csrf'=>$_SESSION['csrf']]); }
    if (!configured()) fail(401,'請先使用安裝碼完成首次設定。');
    if ($action==='login') {
        require_post(); $body=request_body();
        if (!is_string($body['password']??null)) fail(401,'帳號或密碼不正確。');
        login_attempt(text_field($body,'username',200),$body['password']);
        json_response(['authenticated'=>true,'csrf'=>$_SESSION['csrf']]);
    }
    require_admin();
    if ($action==='logout') {
        require_post(); $_SESSION=[];
        setcookie(session_name(),'', ['expires'=>1,'path'=>'/','secure'=>(($_SERVER['HTTPS']??'')==='on'),'httponly'=>true,'samesite'=>'Strict']);
        session_destroy(); json_response(['ok'=>true]);
    }
    if ($_SERVER['REQUEST_METHOD']==='GET') {
        $id=$_GET['id']??''; if (!is_string($id)) fail(400,'作品編號格式不正確。');
        if ($action==='projects') json_response(store(function($s) {
            $ids=array_unique([...array_column($s['published'],'id'),...array_keys($s['drafts'])]);
            $records=array_map(fn($id)=>record($s,$id),array_values($ids));
            usort($records,fn($a,$b)=>($a['project']['sortOrder']??0)<=>($b['project']['sortOrder']??0));
            return ['limits'=>upload_limits(),'revision'=>$s['revision'],'records'=>$records,'history'=>array_map(fn($h)=>['id'=>$h['id'],'at'=>$h['at'],'count'=>count($h['projects'])],$s['history'])];
        }));
        if ($action==='project') json_response(store(fn($s)=>record($s,$id)));
        if ($action==='assets') json_response(store(fn($s)=>['assets'=>array_values(array_filter($s['assets'],fn($a)=>$a['projectId']===$id))]));
        if ($action==='preview') json_response(store(function($s) use($id) {
            $record=record($s,$id);
            $preview=array_values(array_filter($s['published'],fn($p)=>$p['id']!==$id));
            $preview[]=$record['project'];
            return ['projects'=>array_map(fn($p)=>project_view($p,$s,true),$preview),'preview'=>['id'=>$id,'version'=>$record['version'],'hasDraft'=>$record['hasDraft']],'csrf'=>$_SESSION['csrf']];
        }));
        if ($action==='asset') {
            $id=$_GET['asset']??''; $variant=$_GET['variant']??'';
            if (!is_string($id) || !is_string($variant) || !in_array($variant,['cover','display'],true)) fail(404,'找不到圖片。');
            store(function($s)use($id) {if (!isset($s['assets'][$id])) fail(404,'找不到圖片。');});
            $path=asset_path($id,$variant); if (!is_file($path)) fail(404,'找不到圖片。');
            session_write_close(); header('Content-Type: image/webp'); header('Content-Length: '.filesize($path)); readfile($path); exit;
        }
        fail(404,'找不到管理功能。');
    }
    require_post();
    if ($action==='upload') {
        $postLimit=upload_limits()['postBytes'];
        if($postLimit>0 && (int)($_SERVER['CONTENT_LENGTH']??0)>$postLimit) fail(413,'這張圖片超過主機的上傳限制，請重新選擇讓瀏覽器縮小後上傳。');
        $id=$_POST['id']??''; $mode=$_POST['mode']??'photo';
        if (!is_string($id) || !is_string($mode)) fail(422,'上傳資料不正確。');
        store(fn($s)=>record($s,$id));
        $asset=upload_image($id,$mode);
        try { store(function(&$s)use($asset) { $s['assets'][$asset['id']]=$asset; },true); }
        catch(Throwable $error) { foreach(['original','cover','display'] as $v) { $p=asset_path($asset['id'],$v); if(is_file($p)) unlink($p); } throw $error; }
        json_response(['asset'=>$asset],201);
    }
    $body=request_body(); $id=text_field($body,'id',120);
    if ($action==='save') json_response(store(function(&$s)use($body,$id) {
        if ($id==='') { $id='work-'.bin2hex(random_bytes(8)); $s['versions'][$id]=0; }
        else { if(!find_project($s,$id)) fail(404,'找不到作品。'); check_version($s,$id,$body['version']??null); }
        if (!is_array($body['project']??null)) fail(422,'作品資料不正確。');
        $project=normalize_project($body['project'],$s,$id);
        $s['versions'][$id]++; $s['drafts'][$id]=['project'=>$project,'reviewed'=>0];
        return record($s,$id);
    },true));
    if ($action==='review') json_response(store(function(&$s)use($body,$id) {
        check_version($s,$id,$body['version']??null);
        if (isset($s['drafts'][$id])) $s['drafts'][$id]['reviewed']=$s['versions'][$id];
        return ['ok'=>true];
    },true));
    if ($action==='publish') json_response(store(function(&$s)use($body,$id) {
        check_version($s,$id,$body['version']??null);
        if (!isset($s['drafts'][$id]) || $s['drafts'][$id]['reviewed']!==$s['versions'][$id]) fail(409,'請先預覽這次儲存的草稿，再確認發布。');
        $project=normalize_project($s['drafts'][$id]['project'],$s,$id,true);
        publish_assets($project,$s); snapshot($s);
        $s['published']=array_values(array_filter($s['published'],fn($p)=>$p['id']!==$id));
        $s['published'][]=$project;
        usort($s['published'],fn($a,$b)=>$a['sortOrder']<=>$b['sortOrder']);
        unset($s['drafts'][$id]); $s['versions'][$id]++;
        return record($s,$id);
    },true));
    if ($action==='unpublish') json_response(store(function(&$s)use($body,$id) {
        check_version($s,$id,$body['version']??null); $project=find_project($s,$id); if(!$project) fail(404,'找不到作品。');
        snapshot($s); $s['published']=array_values(array_filter($s['published'],fn($p)=>$p['id']!==$id));
        $s['versions'][$id]++; $s['drafts'][$id]=['project'=>$project,'reviewed'=>0];
        return record($s,$id);
    },true));
    if ($action==='delete') json_response(store(function(&$s)use($body,$id) {
        if(!find_project($s,$id)) fail(404,'找不到作品。');
        check_version($s,$id,$body['version']??null);
        $wasPublished=in_array($id,array_column($s['published'],'id'),true);
        if($wasPublished) snapshot($s);
        $s['published']=array_values(array_filter($s['published'],fn($p)=>$p['id']!==$id));
        unset($s['drafts'][$id]);
        // 保留版本墓碑與圖片，避免舊視窗重建已刪作品，並保留公開歷史的還原能力。
        $s['versions'][$id]++;
        return ['ok'=>true];
    },true));
    if ($action==='restore') json_response(store(function(&$s)use($body) {
        if(($body['revision']??null)!==$s['revision']) fail(409,'資料已更新，請重新載入版本清單。');
        $historyId=text_field($body,'historyId',100); $target=null;
        foreach($s['history'] as $h) if($h['id']===$historyId) $target=$h;
        if(!$target) fail(404,'找不到這個歷史版本。');
        foreach($target['projects'] as $p) publish_assets($p,$s);
        foreach($s['published'] as $p) if(!in_array($p['id'],array_column($target['projects'],'id'),true) && !isset($s['drafts'][$p['id']])) $s['drafts'][$p['id']]=['project'=>$p,'reviewed'=>0];
        snapshot($s); $s['published']=$target['projects'];
        // 仍保留未發布草稿，但使所有舊視窗的版本失效，避免覆蓋還原結果。
        foreach($s['versions'] as $id=>$v) $s['versions'][$id]=$v+1;
        foreach($s['drafts'] as &$draft) $draft['reviewed']=0;
        return ['ok'=>true];
    },true));
    fail(404,'找不到管理功能。');
} catch(ApiError $error) { json_response(['message'=>$error->getMessage()],$error->getCode()); }
catch(Throwable $error) { error_log('Portfolio API: '.$error->getMessage()); json_response(['message'=>'服務暫時無法完成操作，請稍後重試或檢查主機紀錄。'],500); }
