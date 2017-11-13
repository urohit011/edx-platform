(function(define) {
    'use strict';

    define(['backbone',
        'jquery',
        'underscore',
        'gettext',
        'edx-ui-toolkit/js/utils/html-utils',
        'js/learner_dashboard/models/course_entitlement_model',
        'text!../../../templates/learner_dashboard/course_entitlement.underscore'
    ],
         function(
             Backbone,
             $,
             _,
             gettext,
             HtmlUtils,
             EntitlementModel,
             pageTpl
         ) {
             return Backbone.View.extend({
                 tpl: HtmlUtils.template(pageTpl),

                 events: {
                     'click .enroll-btn': 'enrollInSession',
                     'change .session-select': 'updateEnrollBtn'
                 },

                 initialize: function(options) {
                     this.$el = options.$el;
                     this.entitlementModel = new EntitlementModel({
                         availableSessions: this.formatDates(JSON.parse(options.availableSessions)),
                         entitlementUUID: options.entitlementUUID,
                         currentSessionId: options.currentSessionId,
                         userId: options.userId
                     });
                     this.enrollUrl = options.enrollUrl;

                     // Grab action elements from outside the view and bind events
                     this.$triggerOpenBtn = options.$triggerOpenBtn;
                     this.$dateDisplayField = options.$dateDisplayField;
                     this.$enterCourseBtn = options.$enterCourseBtn;
                     this.$triggerOpenBtn.on('click', this.toggleSessionSelectionPanel.bind(this));

                     this.render(options);

                     // Grab action elements from the newly generated view
                     this.$sessionSelect = this.$('.session-select');
                 },

                 render: function(options) {
                     var data = this.entitlementModel.toJSON();
                     HtmlUtils.setHtml(this.$el, this.tpl(data));
                     this.delegateEvents();
                 },

                 toggleSessionSelectionPanel: function(e) {
                     /*
                     Opens and closes the panel that allows a user to change their enrolled session.
                      */
                     this.updateEnrollBtn();
                     this.$el.toggleClass('hidden');

                     // Set focus to the session selection for a11y purposes
                     if (!this.$el.hasClass('hidden')){
                         this.$sessionSelect.focus();
                     }
                 },

                 formatDates: function(sessionData) {
                     /*
                     Updates a passed in data object with a localized string representing the start and end
                     dates for a particular course session.
                      */
                    var startDate, startDateString, isCurrentlyEnrolled;
                    for (var i = 0; i < sessionData.length; i++) {
                        isCurrentlyEnrolled = (sessionData[i].session_id)
                        startDate = sessionData[i].session_start;
                        startDateString = startDate ? (new Date(startDate)).toLocaleDateString() : '';
                        sessionData[i].session_dates = sessionData[i].session_end ? startDateString + gettext(" to ")
                            + (new Date(sessionData[i].session_end)).toLocaleDateString() : gettext("Starts ")
                            + startDateString;
                    }
                    return sessionData;
                 },

                 enrollInSession: function(e) {
                     var session_id = this.$sessionSelect.find('option:selected').data('session_id');

                     if (this.$('.enroll-btn').hasClass('disabled')) {
                         return;
                     }

                     $.ajax({
                        type: 'POST',
                        url: this.enrollUrl,
                        dataType: 'json',
                        data: {
                            course_id: session_id,
                            course_uuid: this.entitlementModel.get('entitlementUUID'),
                        },
                        success: _.bind(this.enrollSuccess, this),
                        error: _.bind(this.enrollError, this)
                    });
                 },

                 enrollSuccess: function(data) {
                    this.entitlementModel.set({currentSessionId: 'course-v1:edX+DemoX+Demo_Course'});
                    this.render(this.entitlementModel.toJSON());
                    this.toggleSessionSelectionPanel();

                    // Update external elements on the course card to represent the now available course session
                    this.$triggerOpenBtn.removeClass('hidden');
                    this.$dateDisplayField.text(this.$sessionSelect.val());
                    this.$enterCourseBtn.removeClass('hidden');
                    this.$enterCourseBtn.attr('href','#'); // TODO: get this to be a real string HarryRein!!!
                 },

                 enrollError: function(data) {
                    alert("There was an error in ");
                 },

                 updateEnrollBtn: function() {
                     /*
                     Disables the enroll button if the user has selected an already enrolled session.
                      */
                     var enrollText;
                     var newSessionId = this.$sessionSelect.find('option:selected').data('session_id');
                     var enrollBtn = this.$('.enroll-btn');
                     if (this.entitlementModel.attributes.currentSessionId == newSessionId) {
                        enrollBtn.addClass('disabled');
                     } else {
                        enrollBtn.removeClass('disabled');
                     }

                     // Update the button text
                     if (newSessionId) {
                         enrollText = this.entitlementModel.attributes.currentSessionId ? gettext('Change Session') :
                             gettext('Enroll in Session');
                     } else {
                         enrollText = gettext("Leave Current Session");
                     }
                     this.$('.enroll-btn').text(enrollText);
                 },
             });
         }
    );
}).call(this, define || RequireJS.define);
