from django.conf import settings
from django.core.urlresolvers import reverse

from edxmako.shortcuts import marketing_link
from openedx.core.djangoapps.schedules.utils import get_value_from_settings


def get_base_template_context(site):
    """Dict with entries needed for all templates that use the base template"""
    return {
        # Platform information
        'homepage_url': marketing_link('ROOT'),
        'dashboard_url': reverse('dashboard'),
        'template_revision': getattr(settings, 'EDX_PLATFORM_REVISION', None),
        'platform_name': get_value_from_settings('PLATFORM_NAME', site=site, site_config_name='platform_name'),
        'contact_mailing_address': get_value_from_settings(
            'CONTACT_MAILING_ADDRESS', site=site, site_config_name='contact_mailing_address'),
        'social_media_urls': get_value_from_settings('SOCIAL_MEDIA_FOOTER_URLS', site=site),
        'mobile_store_urls': get_value_from_settings('MOBILE_STORE_URLS', site=site),
    }
