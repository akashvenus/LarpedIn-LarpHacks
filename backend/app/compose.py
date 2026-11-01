def compose_post(event, hook, learnings, conclusion, hashtags):
    lines = [
        hook["text"],
        "",
        f"I recently attended {event['title']}. Here are three things I learned:",
        "",
    ]
    lines += [f"{index}. {item['text']}" for index, item in enumerate(learnings, start=1)]
    lines += ["", conclusion["text"], "", " ".join(tag["text"] for tag in hashtags)]
    return "\n".join(lines)
