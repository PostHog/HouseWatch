from django.utils.html import format_html


def html_link(url, text, new_tab=False):
    if new_tab:
        return format_html('<a href="{}" target="_blank">{}</a>', url, text)
    return format_html('<a href="{}">{}</a>', url, text)


def error_span(text):
    return format_html('<span style="color: red">{}</span>', text)
