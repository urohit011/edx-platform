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

                     // Grab elements from the parent card that work with this view and bind associated events
                     this.$triggerOpenBtn = options.$triggerOpenBtn; // Opens and closes session selection view
                     this.$dateDisplayField = options.$dateDisplayField; // Displays current session dates
                     this.$enterCourseBtn = options.$enterCourseBtn; // Link to course home page
                     this.$triggerOpenBtn.on('click', this.toggleSessionSelectionPanel.bind(this));

                     this.render(options);
                 },

                 render: function(options) {
                     HtmlUtils.setHtml(this.$el, this.tpl(this.entitlementModel.toJSON()));
                     this.delegateEvents();
                 },

                 toggleSessionSelectionPanel: function(e) {
                    /*
                    Opens and closes the session selection panel.
                    */
                    this.$el.toggleClass('hidden');
                    if (!this.$el.hasClass('hidden')){
                        // Set focus to the session selection for a11y purposes
                        this.$('.session-select').focus();
                    }
                    this.updateEnrollBtn();
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
                    this.currentSessionSelection = this.$('.session-select').find('option:selected').data('session_id');

                    if (this.$('.enroll-btn').hasClass('disabled')) {
                        return;
                    }

                    if (!this.currentSessionSelection) {
                        alert("We want to unenroll the user!");
                        return;
                    }

                    // Ensure the user cannot double submit the enrollment
                    this.$('.enroll-btn').addClass('disabled');
                    this.$dateDisplayField.html('<span class="fa fa-spinner fa-spin"></span>');

                    $.ajax({
                        type: 'POST',
                        url: this.enrollUrl,
                        dataType: 'json',
                        data: {
                            course_id: this.currentSessionSelection,
                            course_uuid: this.entitlementModel.get('entitlementUUID'),
                        },
                        success: _.bind(this.enrollSuccess, this),
                        error: _.bind(this.enrollError, this),
                        complete: _.bind(this.enrollComplete, this),
                    });
                 },

                 enrollSuccess: function(data) {
                    // Update the model with the new session Id
                    this.entitlementModel.set({currentSessionId: this.currentSessionSelection});

                    // Update external elements on the course card to represent the now available course session
                    this.$triggerOpenBtn.removeClass('hidden');
                    this.$dateDisplayField.html(this.$('.session-select').val());
                    // TODO: get this to be a real string pointing to the course
                    this.$enterCourseBtn.attr('href','#');
                    this.$enterCourseBtn.removeClass('hidden');
                    this.$dateDisplayField.prepend('<span class="fa fa-check"></span>');

                    // Reload the session selection panel
                    this.render(this.entitlementModel.toJSON());
                    this.toggleSessionSelectionPanel();
                 },

                 enrollError: function(data) {
                    alert("There was an error in ");
                    this.$dateDisplayField.find('fa fa-spin').removeClass('fa-spin fa-spinner').addClass('fa-');
                 },

                 enrollComplete: function(data) {
                    this.$('.enroll-btn').removeClass('disabled');
                 },

                 updateEnrollBtn: function() {
                     /*
                     Disables the enroll button if the user has selected an already enrolled session
                     and updates the text to represent the desired action.
                      */
                     var enrollText;
                     var newSessionId = this.$('.session-select').find('option:selected').data('session_id');
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
