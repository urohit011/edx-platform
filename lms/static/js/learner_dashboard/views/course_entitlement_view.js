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
                     'change .session-select': 'updateEnrollBtn',
                     'click .enroll-btn': 'enrollInSession',
                 },

                 initialize: function(options) {
                     this.$el = options.$el;
                     this.entitlementModel = new EntitlementModel();

                     // Grab external dynamic elements and bind events
                     this.$triggerOpenBtn = $(options.$triggerOpenBtn);
                     this.$triggerOpenBtn.on('click', this.openPanel);

                     this.render(options);

                     this.$sessionSelect = this.$el.find('.session-select');
                     this.$enrollBtn = this.$el.find('.enroll-btn');
                 },

                 render: function(options) {
                     var data = $.extend(this.entitlementModel.toJSON(), {
                         availableSessions: options.availableSessions,
                         entitlementUUID: options.entitlementUUID
                     });
                     HtmlUtils.setHtml(this.$el, this.tpl(data));
                 },

                 openPanel: function(e) {
                     this.$el.removeClass('hidden');
                 },

                 enrollInSession: function(e) {
                     alert("we want to enroll the user in course with id: " + $this.$sessionSelect.val());
                     console.log(this.$el.find('option:selected').data('course_id'));
                 },

                 updateEnrollBtn: function() {
                     var new_id = this.$el.find('option:selected').data('course_id');
                     console.log("new_id");
                     this.$enrollBtn.removeClass('disabled');
                 },
             });
         }
    );
}).call(this, define || RequireJS.define);
