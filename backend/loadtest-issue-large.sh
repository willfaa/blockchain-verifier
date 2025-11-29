#!/usr/bin/env bash

BACKEND_URL="http://localhost:4000/issue"
FILE_PATH="./testdata/large.pdf"
COUNT=20

echo "=== Loadtest /issue dengan file besar (${FILE_PATH}), COUNT=${COUNT} ==="

for i in $(seq 1 $COUNT); do
  echo "---- Request #$i ----"

  START=$(date +%s%3N)
  RES=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "$BACKEND_URL" \
    -F "file=@${FILE_PATH}" \
    -F "nim=2105098405${i}" \
    -F "name=UserBig-$i" \
    -F "majority=Informatics" \
    -F "program=S1 Pendidikan Teknologi Informasi")

  END=$(date +%s%3N)
  DURATION=$((END-START))

  HTTP_BODY=$(echo "$RES" | sed -e 's/HTTPSTATUS\:.*//g')
  HTTP_STATUS=$(echo "$RES" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

  echo "Status : $HTTP_STATUS"
  echo "Time   : ${DURATION} ms"
  echo "[$(date)] #$i STATUS=$HTTP_STATUS TIME=${DURATION}ms" >> loadtest-issue-large.log

  echo "$HTTP_BODY" | head -c 120
  echo -e "\n"
done
