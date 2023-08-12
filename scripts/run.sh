#!/bin/sh
LD_LIBRARY_PATH=lib ./bin/TimetablingSolver -v 2 \
    --parameters "data/parameters.csv" \
    --events "data/events.csv" \
    --resources "data/resources.csv" \
    --event-resources "data/event_resources.csv" \
    --certificate "out/solution.csv" \
    > out/log.txt 2>&1
