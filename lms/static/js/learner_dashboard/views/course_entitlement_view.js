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

                     // Grab external dynamic elements and bind events
                     this.$triggerOpenBtn = options.$triggerOpenBtn;
                     this.$triggerOpenBtn.on('click', this.togglePanel.bind(this));

                     this.render(options);

                     // Grab internal action elements
                     this.$sessionSelect = this.$('.session-select');
                     this.$enrollBtn = this.$('.enroll-btn');

                 },

                 render: function(options) {
                     var data = this.entitlementModel.toJSON();
                     HtmlUtils.setHtml(this.$el, this.tpl(data));
                     this.delegateEvents();
                 },

                 togglePanel: function(e) {
                     var enrollText = this.entitlementModel.attributes.currentSessionId ? gettext('Change Session') :
                         gettext('Enroll in Session');
                     this.$enrollBtn.text(enrollText);
                     this.updateEnrollBtn();
                     this.$el.toggleClass('hidden');
                 },

                 formatDates: function(sessionData) {
                    var startDate, startDateString;
                    for (var i = 0; i < sessionData.length; i++) {
                        startDate = sessionData[i].session_start;
                        startDateString = startDate ? (new Date(startDate)).toLocaleDateString() : '';
                        sessionData[i].session_dates = sessionData[i].session_end ? startDateString + gettext(" to ")
                            + (new Date(sessionData[i].session_end)).toLocaleDateString() : gettext("Starts ") + startDateString;
                    }
                    return sessionData;
                 },

                 enrollInSession: function(e) {
                     var session_id = this.$sessionSelect.find('option:selected').data('course_id');
                     alert("we want to enroll the user in course with id: " + session_id);

                     $.ajax({
                        type: 'POST',
                        url: 'hello',
                        dataType: 'json',
                        data: {
                            course_id: session_id,
                            user_id: this.entitlementModel.get('userId'),
                        },
                        success: _.bind(this.enrollSuccess, this),
                        error: _.bind(this.enrollError, this)
                    });
                 },

                 enrollSuccess: function() {
                    alert("we successfully enrolled!");
                 },

                 enrollError: function() {
                    alert("we failed to enroll..");
                 },

                 updateEnrollBtn: function() {
                     // Disable the enroll button if the user has selected an already enrolled session
                     var new_session_id = this.$sessionSelect.find('option:selected').data('session_id');
                     if (this.entitlementModel.attributes.currentSessionId == new_session_id) {
                        this.$enrollBtn.addClass('disabled');
                     } else {
                        this.$enrollBtn.removeClass('disabled');
                     }

                 },
             });
         }
    );
}).call(this, define || RequireJS.define);
