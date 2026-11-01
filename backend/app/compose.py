def compose_post(event, hook, learnings, conclusion, hashtags):
    lines = [
        hook["text"],
        "",
        f"I'm at {event['title']} ({event['dateLabel']}, {event['venueLabel']}).",
        "",
        "Three things I learned:",
    ]
    lines += [f"- {item['text']}" for item in learnings]
    lines += ["", conclusion["text"], "", " ".join(tag["text"] for tag in hashtags)]
    return "\n".join(lines)
