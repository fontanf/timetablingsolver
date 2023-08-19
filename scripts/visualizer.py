import csv
import datetime
import pandas as pd
import plotly.express as px


if __name__ == "__main__":

    # Parse command line arguments.
    import argparse
    parser = argparse.ArgumentParser(description='')
    parser.add_argument(
            "--parameters",
            type=str,
            required=True,
            help='Parameters file')
    parser.add_argument(
            "--events",
            type=str,
            required=True,
            help='Events file')
    parser.add_argument(
            "--eventresources",
            type=str,
            required=True,
            help='Event resources file')
    parser.add_argument(
            "--certificate",
            type=str,
            required=True,
            help='Certificate file')
    parser.add_argument(
            "--show",
            type=bool,
            default=True,
            help='Show output in browser')
    parser.add_argument(
            "--html",
            type=str,
            default=None,
            help='Html output file')
    args = parser.parse_args()

    events = {}
    resources = set()
    parameters = {}
    with open(args.parameters, 'r') as f:
        reader = csv.DictReader(f)
        for line in reader:
            parameters[line["Name"]] = line["Value"]
    with open(args.events, 'r') as f:
        reader = csv.DictReader(f)
        for line in reader:
            t = datetime.datetime.strptime(
                    line["Duration"],
                    parameters["Duration format"])
            duration = datetime.timedelta(
                    hours=t.hour,
                    minutes=t.minute,
                    seconds=t.second)
            events[line["Name"]] = {
                    "duration": duration,
                    "resources": []}
    with open(args.eventresources, 'r') as f:
        reader = csv.DictReader(f)
        for line in reader:
            events[line["Event"]]["resources"].append(line["Resource"])
            resources.add(line["Resource"])
    with open(args.certificate, 'r') as f:
        reader = csv.DictReader(f)
        for line in reader:
            start = datetime.datetime.strptime(
                    line["Start"],
                    parameters["Date time format"])
            events[line["Event"]]["start"] = start

    d = []
    color_list = px.colors.qualitative.Plotly
    # For each event.
    for event_name, event in events.items():
        # Check if it is scheduled.
        if "start" not in event:
            continue
        # For each resource, add a task to display.
        for resource_name in event["resources"]:
            end = event["start"] + event["duration"]
            d.append(dict(
                event_name=event_name,
                start=event["start"],
                end=end,
                resource_name=resource_name))

    df = pd.DataFrame(d)

    fig = px.timeline(
            df,
            x_start="start",
            x_end="end",
            y="resource_name",
            color="event_name",
            color_discrete_sequence=color_list)

    fig.update_layout(
            yaxis_title="Resources",
            yaxis=dict(dtick=1),
            legend_title="Events")

    if args.show:
        fig.show()
    if args.html is not None:
        fig.write_html(args.html)
