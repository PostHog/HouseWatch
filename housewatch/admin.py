from django.contrib import admin
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

from housewatch import settings


def html_link(url, text, new_tab=False):
    if new_tab:
        return format_html('<a href="{}" target="_blank">{}</a>', url, text)
    return format_html('<a href="{}">{}</a>', url, text)


def error_span(text):
    return format_html('<span style="color: red">{}</span>', text)
