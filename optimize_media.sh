#!/usr/bin/env bash
# Optimizes photos/videos into ./media/<slug>/ . Originals are never modified.
#   images -> WebP (q85, max 2200px on the long side, EXIF rotation applied)
#   videos -> H.264 mp4 (CRF 20, slow preset, max 1080p, AAC 128k, faststart) + poster .webp
# If a re-encoded video comes out larger than the source, the source is remuxed (stream copy) instead.
set -u
cd "$(dirname "$0")"

OUT=media
mkdir -p "$OUT"

# source folder prefix -> output slug
declare -A MAP=(
  ["project1"]="kidsland"
  ["project2"]="kidsland-playhouse"
  ["project3"]="einstein"
  ["project4"]="angels"
  ["project5"]="isfahan-expo"
  ["(عکس های ساخت"]="woodwork"
)

slugify() { # strip extensions, lowercase, keep [a-z0-9_-]
  local n="${1%.*}"
  echo "$n" | tr 'A-Z' 'a-z' | sed 's/[^a-z0-9_-]/_/g'
}

for dir in */; do
  dir="${dir%/}"
  slug=""
  for prefix in "${!MAP[@]}"; do
    [[ "$dir" == "$prefix"* ]] && slug="${MAP[$prefix]}"
  done
  [ -z "$slug" ] && continue
  mkdir -p "$OUT/$slug"

  while IFS= read -r -d '' f; do
    base="$(basename "$f")"
    ext="${base##*.}"; ext="${ext,,}"
    name="$(slugify "$base")"
    case "$ext" in
      jpg|jpeg|png)
        dst="$OUT/$slug/$name.webp"
        [ -s "$dst" ] && continue
        ffmpeg -nostdin -v error -y -i "$f" \
          -vf "scale='min(2200,iw)':'min(2200,ih)':force_original_aspect_ratio=decrease" \
          -c:v libwebp -quality 85 -compression_level 6 "$dst" \
          && echo "img  $slug/$name.webp"
        ;;
      mp4|mov)
        dst="$OUT/$slug/$name.mp4"
        [ -s "$dst" ] && continue
        ffmpeg -nostdin -v error -y -i "$f" \
          -vf "scale='min(1920,iw)':'min(1920,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2,format=yuv420p" \
          -c:v libx264 -preset slow -crf 20 -profile:v high -movflags +faststart \
          -c:a aac -b:a 128k "$dst"
        src_sz=$(stat -c %s "$f"); dst_sz=$(stat -c %s "$dst")
        if [ "$dst_sz" -ge "$src_sz" ]; then
          ffmpeg -nostdin -v error -y -i "$f" -c copy -movflags +faststart -f mp4 "$dst"
          echo "vid  $slug/$name.mp4 (kept original quality, already small)"
        else
          echo "vid  $slug/$name.mp4"
        fi
        ffmpeg -nostdin -v error -y -ss 1 -i "$dst" -frames:v 1 \
          -vf "scale='min(1280,iw)':-2" -c:v libwebp -quality 80 "$OUT/$slug/$name.poster.webp" \
          || ffmpeg -nostdin -v error -y -i "$dst" -frames:v 1 -vf "scale='min(1280,iw)':-2" \
               -c:v libwebp -quality 80 "$OUT/$slug/$name.poster.webp"
        ;;
    esac
  done < <(find "$dir" -maxdepth 1 -type f -print0 | sort -z)
done

echo
echo "== done =="
du -sh "$OUT"
find "$OUT" -type f -size +95M -print | sed 's/^/WARNING >95MB: /'
