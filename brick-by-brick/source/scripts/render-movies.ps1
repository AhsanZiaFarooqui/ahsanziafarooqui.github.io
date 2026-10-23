param([string]$Only = '')
$ErrorActionPreference = 'Stop'
$movieRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$vlcPath = 'C:\Program Files\VideoLAN\VLC\vlc.exe'
if (-not (Test-Path -LiteralPath $vlcPath)) { throw 'Install VLC from videolan.org, or update the local renderer path. Prebuilt MP4 files do not require VLC.' }
Add-Type -Path (Join-Path $PSScriptRoot 'BrickMovie.cs') -ReferencedAssemblies System.Drawing,System.Web.Extensions
$scripts = Get-ChildItem -LiteralPath (Join-Path $movieRoot 'media-work\scripts') -Filter '*.json'
foreach ($file in $scripts) {
  $id = $file.BaseName
  if ($Only -and $id -ne $Only) { continue }
  $aviPath = Join-Path $movieRoot "media-work\$id.avi"
  $mp4Path = Join-Path $movieRoot "public\videos\$id.mp4"
  $posterPath = Join-Path $movieRoot "public\videos\$id.png"
  $logPath = Join-Path $movieRoot "media-work\$id-encode.log"
  [BrickMovie]::Render($file.FullName,$aviPath,$posterPath)
  $arguments = @('--intf','dummy','--no-one-instance','--no-audio','--no-video-title-show','--no-plugins-cache','--ignore-config','--no-media-library','--no-metadata-network-access','--verbose=1','--file-logging',('--logfile="'+$logPath+'"'),('"'+$aviPath+'"'),'--sout',('"#transcode{vcodec=h264,vb=650,fps=12,venc=x264{preset=ultrafast}}:std{access=file,mux=mp4,dst='+$mp4Path+'}"'),'vlc://quit')
  Start-Process -FilePath $vlcPath -ArgumentList $arguments -WindowStyle Hidden -Wait
  if (-not (Test-Path -LiteralPath $mp4Path)) { throw "No encoded video: $id" }
  if ((Get-Item -LiteralPath $mp4Path).Length -lt 10000) { throw "Video encoding failed for $id; inspect $logPath" }
  # Remove only this generated intermediate file, inside the checked workspace.
  $checkedAvi = (Resolve-Path -LiteralPath $aviPath).Path
  if ($checkedAvi.StartsWith((Join-Path $movieRoot 'media-work') + '\')) { Remove-Item -LiteralPath $checkedAvi }
  Write-Output "Rendered $id"
}
