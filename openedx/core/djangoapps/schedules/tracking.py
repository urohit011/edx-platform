from urlparse import parse_qs

import attr
from django.utils.http import urlencode

from openedx.core.djangoapps.schedules.utils import get_value_from_settings


DEFAULT_CAMPAIGN_SOURCE = 'ace'
DEFAULT_CAMPAIGN_MEDIUM = 'email'


@attr.s
class CampaignTrackingInfo(object):
    """
    A struct for storing the set of UTM parameters that are recognized by tracking tools when included in URLs.
    """
    source = attr.ib(default=DEFAULT_CAMPAIGN_SOURCE)
    medium = attr.ib(default=DEFAULT_CAMPAIGN_MEDIUM)
    campaign = attr.ib(default=None)
    term = attr.ib(default=None)
    content = attr.ib(default=None)

    def to_query_string(self, existing_query_string=None):
        """
        Generate a query string that includes the tracking parameters in addition to any existing parameters.

        Note that any existing UTM parameters will be overridden by the values in this instance of CampaignTrackingInfo.

        Args:
            existing_query_string (str): An existing query string that needs to be updated to include this tracking
                information.

        Returns:
            str: The URL encoded string that should be used as the query string in the URL.
        """
        parameters = {}
        if existing_query_string is not None:
            parameters = parse_qs(existing_query_string)

        for attribute, value in attr.asdict(self).iteritems():
            if value is not None:
                parameters['utm_' + attribute] = [value]
        return urlencode(parameters, doseq=True)


@attr.s
class GoogleAnalyticsTrackingPixel(object):
    """
    Implementation of the Google Analytics measurement protocol for email tracking.

    See this document for more info: https://developers.google.com/analytics/devguides/collection/protocol/v1/email
    """
    ANONYMOUS_USER_CLIENT_ID = 555

    site = attr.ib(default=None)
    course_id = attr.ib(default=None)

    version = attr.ib(default=1, metadata={'param_name': 'v'})
    hit_type = attr.ib(default='event', metadata={'param_name': 't'})

    campaign_source = attr.ib(default=DEFAULT_CAMPAIGN_SOURCE, metadata={'param_name': 'cs'})
    campaign_medium = attr.ib(default=DEFAULT_CAMPAIGN_MEDIUM, metadata={'param_name': 'cm'})
    campaign_name = attr.ib(default=None, metadata={'param_name': 'cn'})
    campaign_content = attr.ib(default=None, metadata={'param_name': 'cc'})

    event_category = attr.ib(default='email', metadata={'param_name': 'ec'})
    event_action = attr.ib(default='edx.bi.email.opened', metadata={'param_name': 'ea'})
    event_label = attr.ib(default=None, metadata={'param_name': 'el'})

    document_path = attr.ib(default=None, metadata={'param_name': 'dp'})

    user_id = attr.ib(default=None, metadata={'param_name': 'uid'})
    client_id = attr.ib(default=ANONYMOUS_USER_CLIENT_ID, metadata={'param_name': 'cid'})

    @property
    def image_url(self):
        """
        A URL to a clear image that can be embedded in HTML documents to track email open events.

        The query string of this URL is used to capture data about the email and visitor.
        """
        parameters = {}
        fields = attr.fields(self.__class__)
        for attribute in fields:
            value = getattr(self, attribute.name, None)
            if value is not None and 'param_name' in attribute.metadata:
                parameter_name = attribute.metadata['param_name']
                parameters[parameter_name] = str(value)

        tracking_id = get_value_from_settings("GOOGLE_ANALYTICS_ACCOUNT", site=self.site)
        if tracking_id is None:
            tracking_id = get_value_from_settings("GOOGLE_ANALYTICS_TRACKING_ID", site=self.site)

        if tracking_id is None:
            return None

        parameters['tid'] = tracking_id

        user_id_dimension = get_value_from_settings("GOOGLE_ANALYTICS_USER_ID_CUSTOM_DIMENSION", site=self.site)
        if user_id_dimension is not None and self.user_id is not None:
            parameter_name = 'cd{0}'.format(user_id_dimension)
            parameters[parameter_name] = self.user_id

        if self.course_id is not None and self.event_label is None:
            param_name = fields.event_label.metadata['param_name']
            parameters[param_name] = unicode(self.course_id)

        return u"https://www.google-analytics.com/collect?{params}".format(params=urlencode(parameters))
