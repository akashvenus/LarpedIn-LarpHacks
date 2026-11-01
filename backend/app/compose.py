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


def compose_personal_post(event, hook, conclusion, hashtags, moment, person, next_step, custom_hook="", custom_conclusion=""):
    def sentence(value):
        value = value.strip()
        return value if value.endswith((".", "!", "?")) else value + "."

    paragraphs = [sentence(custom_hook) if custom_hook.strip() else hook["text"], f"I recently attended {event['title']}."]
    details = []
    if moment.strip():
        details.append("One moment that stuck with me: " + sentence(moment))
    if person.strip():
        details.append("A big thank you to " + sentence(person))
    if details:
        paragraphs.append(" ".join(details))
    closing = []
    if next_step.strip():
        closing.append("Next up: " + sentence(next_step))
    closing.append(sentence(custom_conclusion) if custom_conclusion.strip() else conclusion["text"])
    paragraphs.extend([" ".join(closing), " ".join(tag["text"] for tag in hashtags)])
    return "\n\n".join(paragraphs)
