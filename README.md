# TimetablingSolver

A solver for timetabling problems.

This tool is designed to help building timetables to schedule some events according to the availabilities and preferences of the attendees.

Input example:

<img src="https://github.com/fontanf/timetablingsolver/blob/main/img/input.png" height="512">

Output:

<img src="https://github.com/fontanf/timetablingsolver/blob/main/img/output.png" height="512">

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

       Event            Duration # resources
       -----            -------- -----------
           0       2    00:30:00           2
           1       2    00:30:00           2
           2       3    00:45:00           2
           3       3    00:45:00           2
           4       2    00:30:00           2
           5       4    01:00:00           6

    Resource    # events
    --------    --------
           0           6
           1           2
           2           2
           3           2
           4           2
           5           2

       Event    Resource
       -----    --------
           0           0
           0           1
           1           0
           1           2
           2           0
           2           3
           3           0
           3           4
           4           0
           4           5
           5           0
           5           1
           5           2
           5           3
           5           4
           5           5

    Resource                                        Time       Score
    --------                                        ----       -----
           0       0            Thu Sep 07 16:00:00 2023           0
           0       1            Thu Sep 07 16:15:00 2023           0
           0       2            Thu Sep 07 16:30:00 2023           0
           0       3            Thu Sep 07 16:45:00 2023           0
           0       4            Thu Sep 07 17:00:00 2023           0
           0       5            Thu Sep 07 17:15:00 2023           0
           0       6            Thu Sep 07 17:30:00 2023           0
           0       7            Thu Sep 07 17:45:00 2023           0
           0       8            Thu Sep 07 18:00:00 2023          10
           0       9            Thu Sep 07 18:15:00 2023          10
           0      10            Thu Sep 07 18:30:00 2023          10
           0      11            Thu Sep 07 18:45:00 2023          10
           0      96            Fri Sep 08 16:00:00 2023           0
           0      97            Fri Sep 08 16:15:00 2023           0
           0      98            Fri Sep 08 16:30:00 2023           0
           0      99            Fri Sep 08 16:45:00 2023           0
           0     100            Fri Sep 08 17:00:00 2023           0
           0     101            Fri Sep 08 17:15:00 2023           0
           0     102            Fri Sep 08 17:30:00 2023           0
           0     103            Fri Sep 08 17:45:00 2023           0
           0     104            Fri Sep 08 18:00:00 2023          10
           0     105            Fri Sep 08 18:15:00 2023          10
           0     106            Fri Sep 08 18:30:00 2023          10
           0     107            Fri Sep 08 18:45:00 2023          10
           1       0            Thu Sep 07 16:00:00 2023           0
           1       1            Thu Sep 07 16:15:00 2023           0
           1       2            Thu Sep 07 16:30:00 2023           0
           1       3            Thu Sep 07 16:45:00 2023           0
           1       4            Thu Sep 07 17:00:00 2023           3
           1       5            Thu Sep 07 17:15:00 2023           3
           1       6            Thu Sep 07 17:30:00 2023           3
           1       7            Thu Sep 07 17:45:00 2023           3
           1       8            Thu Sep 07 18:00:00 2023           3
           1       9            Thu Sep 07 18:15:00 2023           3
           1      10            Thu Sep 07 18:30:00 2023           3
           1      11            Thu Sep 07 18:45:00 2023           3
           1      96            Fri Sep 08 16:00:00 2023           3
           1      97            Fri Sep 08 16:15:00 2023           3
           1      98            Fri Sep 08 16:30:00 2023           3
           1      99            Fri Sep 08 16:45:00 2023           3
           1     100            Fri Sep 08 17:00:00 2023           3
           1     101            Fri Sep 08 17:15:00 2023           3
           1     102            Fri Sep 08 17:30:00 2023           3
           1     103            Fri Sep 08 17:45:00 2023           3
           1     104            Fri Sep 08 18:00:00 2023           1
           1     105            Fri Sep 08 18:15:00 2023           1
           1     106            Fri Sep 08 18:30:00 2023           1
           1     107            Fri Sep 08 18:45:00 2023           1
           2       0            Thu Sep 07 16:00:00 2023           0
           2       1            Thu Sep 07 16:15:00 2023           0
           2       2            Thu Sep 07 16:30:00 2023           0
           2       3            Thu Sep 07 16:45:00 2023           0
           2       4            Thu Sep 07 17:00:00 2023           3
           2       5            Thu Sep 07 17:15:00 2023           3
           2       6            Thu Sep 07 17:30:00 2023           3
           2       7            Thu Sep 07 17:45:00 2023           3
           2       8            Thu Sep 07 18:00:00 2023           3
           2       9            Thu Sep 07 18:15:00 2023           3
           2      10            Thu Sep 07 18:30:00 2023           3
           2      11            Thu Sep 07 18:45:00 2023           3
           2      96            Fri Sep 08 16:00:00 2023           1
           2      97            Fri Sep 08 16:15:00 2023           1
           2      98            Fri Sep 08 16:30:00 2023           1
           2      99            Fri Sep 08 16:45:00 2023           1
           2     100            Fri Sep 08 17:00:00 2023           1
           2     101            Fri Sep 08 17:15:00 2023           1
           2     102            Fri Sep 08 17:30:00 2023           1
           2     103            Fri Sep 08 17:45:00 2023           1
           2     104            Fri Sep 08 18:00:00 2023           3
           2     105            Fri Sep 08 18:15:00 2023           3
           2     106            Fri Sep 08 18:30:00 2023           3
           2     107            Fri Sep 08 18:45:00 2023           3
           3       0            Thu Sep 07 16:00:00 2023           3
           3       1            Thu Sep 07 16:15:00 2023           3
           3       2            Thu Sep 07 16:30:00 2023           3
           3       3            Thu Sep 07 16:45:00 2023           3
           3       4            Thu Sep 07 17:00:00 2023           3
           3       5            Thu Sep 07 17:15:00 2023           3
           3       6            Thu Sep 07 17:30:00 2023           3
           3       7            Thu Sep 07 17:45:00 2023           3
           3       8            Thu Sep 07 18:00:00 2023           3
           3       9            Thu Sep 07 18:15:00 2023           3
           3      10            Thu Sep 07 18:30:00 2023           3
           3      11            Thu Sep 07 18:45:00 2023           3
           3      96            Fri Sep 08 16:00:00 2023           1
           3      97            Fri Sep 08 16:15:00 2023           1
           3      98            Fri Sep 08 16:30:00 2023           1
           3      99            Fri Sep 08 16:45:00 2023           1
           3     100            Fri Sep 08 17:00:00 2023           0
           3     101            Fri Sep 08 17:15:00 2023           0
           3     102            Fri Sep 08 17:30:00 2023           0
           3     103            Fri Sep 08 17:45:00 2023           0
           3     104            Fri Sep 08 18:00:00 2023           3
           3     105            Fri Sep 08 18:15:00 2023           3
           3     106            Fri Sep 08 18:30:00 2023           3
           3     107            Fri Sep 08 18:45:00 2023           3
           4       0            Thu Sep 07 16:00:00 2023           3
           4       1            Thu Sep 07 16:15:00 2023           3
           4       2            Thu Sep 07 16:30:00 2023           3
           4       3            Thu Sep 07 16:45:00 2023           3
           4       4            Thu Sep 07 17:00:00 2023           1
           4       5            Thu Sep 07 17:15:00 2023           1
           4       6            Thu Sep 07 17:30:00 2023           1
           4       7            Thu Sep 07 17:45:00 2023           1
           4       8            Thu Sep 07 18:00:00 2023           1
           4       9            Thu Sep 07 18:15:00 2023           1
           4      10            Thu Sep 07 18:30:00 2023           1
           4      11            Thu Sep 07 18:45:00 2023           1
           4      96            Fri Sep 08 16:00:00 2023           3
           4      97            Fri Sep 08 16:15:00 2023           3
           4      98            Fri Sep 08 16:30:00 2023           3
           4      99            Fri Sep 08 16:45:00 2023           3
           4     100            Fri Sep 08 17:00:00 2023           0
           4     101            Fri Sep 08 17:15:00 2023           0
           4     102            Fri Sep 08 17:30:00 2023           0
           4     103            Fri Sep 08 17:45:00 2023           0
           4     104            Fri Sep 08 18:00:00 2023           3
           4     105            Fri Sep 08 18:15:00 2023           3
           4     106            Fri Sep 08 18:30:00 2023           3
           4     107            Fri Sep 08 18:45:00 2023           3
           5       0            Thu Sep 07 16:00:00 2023           3
           5       1            Thu Sep 07 16:15:00 2023           3
           5       2            Thu Sep 07 16:30:00 2023           3
           5       3            Thu Sep 07 16:45:00 2023           3
           5       4            Thu Sep 07 17:00:00 2023           1
           5       5            Thu Sep 07 17:15:00 2023           1
           5       6            Thu Sep 07 17:30:00 2023           1
           5       7            Thu Sep 07 17:45:00 2023           1
           5       8            Thu Sep 07 18:00:00 2023           1
           5       9            Thu Sep 07 18:15:00 2023           1
           5      10            Thu Sep 07 18:30:00 2023           1
           5      11            Thu Sep 07 18:45:00 2023           1
           5      96            Fri Sep 08 16:00:00 2023           3
           5      97            Fri Sep 08 16:15:00 2023           3
           5      98            Fri Sep 08 16:30:00 2023           3
           5      99            Fri Sep 08 16:45:00 2023           3
           5     100            Fri Sep 08 17:00:00 2023           0
           5     101            Fri Sep 08 17:15:00 2023           0
           5     102            Fri Sep 08 17:30:00 2023           0
           5     103            Fri Sep 08 17:45:00 2023           0
           5     104            Fri Sep 08 18:00:00 2023           0
           5     105            Fri Sep 08 18:15:00 2023           0
           5     106            Fri Sep 08 18:30:00 2023           0
           5     107            Fri Sep 08 18:45:00 2023           0

       T (s)    # events       Score                 Comment
       -----    --------       -----                 -------
       0.020           6          12                        

Final statistics
----------------
Time (s):                     0.0204497

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
