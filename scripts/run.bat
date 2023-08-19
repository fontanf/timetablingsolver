.\bin\TimetablingSolver -v 2 ^
    --parameters "data\parameters.csv" ^
    --events "data\events.csv" ^
    --resources "data\resources.csv" ^
    --event-resources "data\event_resources.csv" ^
    --certificate "out\solution.csv" ^
    --score "out\solution_scores.csv" ^
    --milp-mps-path "log\milp_model" ^
    > log\log.txt 2>&1
.\bin\visualizer ^
    --parameters "data\parameters.csv" ^
    --events "data\events.csv" ^
    --eventresources "data\event_resources.csv" ^
    --certificate "out\solution.csv" ^
    --show 1 ^
    --html "out\plot.html" ^
    > log\log.txt 2>&1
