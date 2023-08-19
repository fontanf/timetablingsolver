# TimetablingSolver

A solver for timetabling problems.

This tool is designed to help building timetables to schedule some events according to the availabilities and preferences of the attendees.

Input example:

<img src="https://github.com/fontanf/timetablingsolver/blob/main/img/input.png" height="512">

Output:

<img src="https://github.com/fontanf/timetablingsolver/blob/main/img/output.png" height="512">

<img src="https://github.com/fontanf/timetablingsolver/blob/main/img/plot.png" height="256">

## Usage

Install CBC and Update its path in the `WORKSPACE` file.

Compile:
```shell
bazel build -- //...
```

Execute:
```shell
./bazel-bin/timetablingsolver/main -v 4 --parameters data/example/parameters.csv --events data/example/events.csv --resources data/example/resources.csv --event-resources data/example/event_resources.csv --certificate solution.csv
```
```
===================================
         TimetablingSolver         
===================================

Instance
--------
Number of events:           6
Number of resources:        6
Horizon:                    109
Number of time steps used:  24

       Event                    Name            Duration # resources
       -----                    ----            -------- -----------
           0           Lesson Audrey       2    00:30:00           2
           1            Lesson Henry       2    00:30:00           2
           2        Lesson Francesca       3    00:45:00           2
           3           Lesson Thomas       3    00:45:00           2
           4          Lesson Adeline       2    00:30:00           2
           5            Group Lesson       4    01:00:00           6

    Resource                    Name    # events
    --------                    ----    --------
           0                 Teacher           6
           1                  Audrey           2
           2                   Henry           2
           3               Francesca           2
           4                  Thomas           2
           5                 Adeline           2

       Event                    Name    Resource                    Name
       -----                    ----    --------                    ----
           0           Lesson Audrey           0                 Teacher
           0           Lesson Audrey           1                  Audrey
           1            Lesson Henry           0                 Teacher
           1            Lesson Henry           2                   Henry
           2        Lesson Francesca           0                 Teacher
           2        Lesson Francesca           3               Francesca
           3           Lesson Thomas           0                 Teacher
           3           Lesson Thomas           4                  Thomas
           4          Lesson Adeline           0                 Teacher
           4          Lesson Adeline           5                 Adeline
           5            Group Lesson           0                 Teacher
           5            Group Lesson           1                  Audrey
           5            Group Lesson           2                   Henry
           5            Group Lesson           3               Francesca
           5            Group Lesson           4                  Thomas
           5            Group Lesson           5                 Adeline

    Resource                    Name                                        Time       Score
    --------                    ----                                        ----       -----
           0                 Teacher       0            Thu Sep 07 16:00:00 2023           0
           0                 Teacher       1            Thu Sep 07 16:15:00 2023           0
           0                 Teacher       2            Thu Sep 07 16:30:00 2023           0
           0                 Teacher       3            Thu Sep 07 16:45:00 2023           0
           0                 Teacher       4            Thu Sep 07 17:00:00 2023           0
           0                 Teacher       5            Thu Sep 07 17:15:00 2023           0
           0                 Teacher       6            Thu Sep 07 17:30:00 2023           0
           0                 Teacher       7            Thu Sep 07 17:45:00 2023           0
           0                 Teacher       8            Thu Sep 07 18:00:00 2023          10
           0                 Teacher       9            Thu Sep 07 18:15:00 2023          10
           0                 Teacher      10            Thu Sep 07 18:30:00 2023          10
           0                 Teacher      11            Thu Sep 07 18:45:00 2023          10
           0                 Teacher      96            Fri Sep 08 16:00:00 2023           0
           0                 Teacher      97            Fri Sep 08 16:15:00 2023           0
           0                 Teacher      98            Fri Sep 08 16:30:00 2023           0
           0                 Teacher      99            Fri Sep 08 16:45:00 2023           0
           0                 Teacher     100            Fri Sep 08 17:00:00 2023           0
           0                 Teacher     101            Fri Sep 08 17:15:00 2023           0
           0                 Teacher     102            Fri Sep 08 17:30:00 2023           0
           0                 Teacher     103            Fri Sep 08 17:45:00 2023           0
           0                 Teacher     104            Fri Sep 08 18:00:00 2023          10
           0                 Teacher     105            Fri Sep 08 18:15:00 2023          10
           0                 Teacher     106            Fri Sep 08 18:30:00 2023          10
           0                 Teacher     107            Fri Sep 08 18:45:00 2023          10
           1                  Audrey       0            Thu Sep 07 16:00:00 2023           0
           1                  Audrey       1            Thu Sep 07 16:15:00 2023           0
           1                  Audrey       2            Thu Sep 07 16:30:00 2023           0
           1                  Audrey       3            Thu Sep 07 16:45:00 2023           0
           1                  Audrey       4            Thu Sep 07 17:00:00 2023           3
           1                  Audrey       5            Thu Sep 07 17:15:00 2023           3
           1                  Audrey       6            Thu Sep 07 17:30:00 2023           3
           1                  Audrey       7            Thu Sep 07 17:45:00 2023           3
           1                  Audrey       8            Thu Sep 07 18:00:00 2023           3
           1                  Audrey       9            Thu Sep 07 18:15:00 2023           3
           1                  Audrey      10            Thu Sep 07 18:30:00 2023           3
           1                  Audrey      11            Thu Sep 07 18:45:00 2023           3
           1                  Audrey      96            Fri Sep 08 16:00:00 2023           3
           1                  Audrey      97            Fri Sep 08 16:15:00 2023           3
           1                  Audrey      98            Fri Sep 08 16:30:00 2023           3
           1                  Audrey      99            Fri Sep 08 16:45:00 2023           3
           1                  Audrey     100            Fri Sep 08 17:00:00 2023           3
           1                  Audrey     101            Fri Sep 08 17:15:00 2023           3
           1                  Audrey     102            Fri Sep 08 17:30:00 2023           3
           1                  Audrey     103            Fri Sep 08 17:45:00 2023           3
           1                  Audrey     104            Fri Sep 08 18:00:00 2023           1
           1                  Audrey     105            Fri Sep 08 18:15:00 2023           1
           1                  Audrey     106            Fri Sep 08 18:30:00 2023           1
           1                  Audrey     107            Fri Sep 08 18:45:00 2023           1
           2                   Henry       0            Thu Sep 07 16:00:00 2023           0
           2                   Henry       1            Thu Sep 07 16:15:00 2023           0
           2                   Henry       2            Thu Sep 07 16:30:00 2023           0
           2                   Henry       3            Thu Sep 07 16:45:00 2023           0
           2                   Henry       4            Thu Sep 07 17:00:00 2023           3
           2                   Henry       5            Thu Sep 07 17:15:00 2023           3
           2                   Henry       6            Thu Sep 07 17:30:00 2023           3
           2                   Henry       7            Thu Sep 07 17:45:00 2023           3
           2                   Henry       8            Thu Sep 07 18:00:00 2023           3
           2                   Henry       9            Thu Sep 07 18:15:00 2023           3
           2                   Henry      10            Thu Sep 07 18:30:00 2023           3
           2                   Henry      11            Thu Sep 07 18:45:00 2023           3
           2                   Henry      96            Fri Sep 08 16:00:00 2023           1
           2                   Henry      97            Fri Sep 08 16:15:00 2023           1
           2                   Henry      98            Fri Sep 08 16:30:00 2023           1
           2                   Henry      99            Fri Sep 08 16:45:00 2023           1
           2                   Henry     100            Fri Sep 08 17:00:00 2023           1
           2                   Henry     101            Fri Sep 08 17:15:00 2023           1
           2                   Henry     102            Fri Sep 08 17:30:00 2023           1
           2                   Henry     103            Fri Sep 08 17:45:00 2023           1
           2                   Henry     104            Fri Sep 08 18:00:00 2023           3
           2                   Henry     105            Fri Sep 08 18:15:00 2023           3
           2                   Henry     106            Fri Sep 08 18:30:00 2023           3
           2                   Henry     107            Fri Sep 08 18:45:00 2023           3
           3               Francesca       0            Thu Sep 07 16:00:00 2023           3
           3               Francesca       1            Thu Sep 07 16:15:00 2023           3
           3               Francesca       2            Thu Sep 07 16:30:00 2023           3
           3               Francesca       3            Thu Sep 07 16:45:00 2023           3
           3               Francesca       4            Thu Sep 07 17:00:00 2023           3
           3               Francesca       5            Thu Sep 07 17:15:00 2023           3
           3               Francesca       6            Thu Sep 07 17:30:00 2023           3
           3               Francesca       7            Thu Sep 07 17:45:00 2023           3
           3               Francesca       8            Thu Sep 07 18:00:00 2023           3
           3               Francesca       9            Thu Sep 07 18:15:00 2023           3
           3               Francesca      10            Thu Sep 07 18:30:00 2023           3
           3               Francesca      11            Thu Sep 07 18:45:00 2023           3
           3               Francesca      96            Fri Sep 08 16:00:00 2023           1
           3               Francesca      97            Fri Sep 08 16:15:00 2023           1
           3               Francesca      98            Fri Sep 08 16:30:00 2023           1
           3               Francesca      99            Fri Sep 08 16:45:00 2023           1
           3               Francesca     100            Fri Sep 08 17:00:00 2023           0
           3               Francesca     101            Fri Sep 08 17:15:00 2023           0
           3               Francesca     102            Fri Sep 08 17:30:00 2023           0
           3               Francesca     103            Fri Sep 08 17:45:00 2023           0
           3               Francesca     104            Fri Sep 08 18:00:00 2023           3
           3               Francesca     105            Fri Sep 08 18:15:00 2023           3
           3               Francesca     106            Fri Sep 08 18:30:00 2023           3
           3               Francesca     107            Fri Sep 08 18:45:00 2023           3
           4                  Thomas       0            Thu Sep 07 16:00:00 2023           3
           4                  Thomas       1            Thu Sep 07 16:15:00 2023           3
           4                  Thomas       2            Thu Sep 07 16:30:00 2023           3
           4                  Thomas       3            Thu Sep 07 16:45:00 2023           3
           4                  Thomas       4            Thu Sep 07 17:00:00 2023           1
           4                  Thomas       5            Thu Sep 07 17:15:00 2023           1
           4                  Thomas       6            Thu Sep 07 17:30:00 2023           1
           4                  Thomas       7            Thu Sep 07 17:45:00 2023           1
           4                  Thomas       8            Thu Sep 07 18:00:00 2023           1
           4                  Thomas       9            Thu Sep 07 18:15:00 2023           1
           4                  Thomas      10            Thu Sep 07 18:30:00 2023           1
           4                  Thomas      11            Thu Sep 07 18:45:00 2023           1
           4                  Thomas      96            Fri Sep 08 16:00:00 2023           3
           4                  Thomas      97            Fri Sep 08 16:15:00 2023           3
           4                  Thomas      98            Fri Sep 08 16:30:00 2023           3
           4                  Thomas      99            Fri Sep 08 16:45:00 2023           3
           4                  Thomas     100            Fri Sep 08 17:00:00 2023           0
           4                  Thomas     101            Fri Sep 08 17:15:00 2023           0
           4                  Thomas     102            Fri Sep 08 17:30:00 2023           0
           4                  Thomas     103            Fri Sep 08 17:45:00 2023           0
           4                  Thomas     104            Fri Sep 08 18:00:00 2023           3
           4                  Thomas     105            Fri Sep 08 18:15:00 2023           3
           4                  Thomas     106            Fri Sep 08 18:30:00 2023           3
           4                  Thomas     107            Fri Sep 08 18:45:00 2023           3
           5                 Adeline       0            Thu Sep 07 16:00:00 2023           3
           5                 Adeline       1            Thu Sep 07 16:15:00 2023           3
           5                 Adeline       2            Thu Sep 07 16:30:00 2023           3
           5                 Adeline       3            Thu Sep 07 16:45:00 2023           3
           5                 Adeline       4            Thu Sep 07 17:00:00 2023           1
           5                 Adeline       5            Thu Sep 07 17:15:00 2023           1
           5                 Adeline       6            Thu Sep 07 17:30:00 2023           1
           5                 Adeline       7            Thu Sep 07 17:45:00 2023           1
           5                 Adeline       8            Thu Sep 07 18:00:00 2023           1
           5                 Adeline       9            Thu Sep 07 18:15:00 2023           1
           5                 Adeline      10            Thu Sep 07 18:30:00 2023           1
           5                 Adeline      11            Thu Sep 07 18:45:00 2023           1
           5                 Adeline      96            Fri Sep 08 16:00:00 2023           3
           5                 Adeline      97            Fri Sep 08 16:15:00 2023           3
           5                 Adeline      98            Fri Sep 08 16:30:00 2023           3
           5                 Adeline      99            Fri Sep 08 16:45:00 2023           3
           5                 Adeline     100            Fri Sep 08 17:00:00 2023           0
           5                 Adeline     101            Fri Sep 08 17:15:00 2023           0
           5                 Adeline     102            Fri Sep 08 17:30:00 2023           0
           5                 Adeline     103            Fri Sep 08 17:45:00 2023           0
           5                 Adeline     104            Fri Sep 08 18:00:00 2023           0
           5                 Adeline     105            Fri Sep 08 18:15:00 2023           0
           5                 Adeline     106            Fri Sep 08 18:30:00 2023           0
           5                 Adeline     107            Fri Sep 08 18:45:00 2023           0

       T (s)    # events       Score                 Comment
       -----    --------       -----                 -------
       0.021           6          12                        

Final statistics
----------------
Time (s):                     0.0207195

Solution
--------
Number of events:     6 / 6 (100%)
Score:                12

       Event            Duration                                        Time   Score
       -----            --------                                        ----   -----
           0       2    00:30:00       0            Thu Sep 07 16:00:00 2023       0
           1       2    00:30:00      98            Fri Sep 08 16:30:00 2023       1
           2       3    00:45:00       2            Thu Sep 07 16:30:00 2023       3
           3       3    00:45:00       5            Thu Sep 07 17:15:00 2023       1
           4       2    00:30:00      96            Fri Sep 08 16:00:00 2023       3
           5       4    01:00:00     100            Fri Sep 08 17:00:00 2023       4
```
