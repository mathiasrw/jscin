// Copyright 2013 Google Inc. All Rights Reserved.

/**
 * @fileoverview ChromeExtension-based Input Method Module
 * @author hungte@google.com (Hung-Te Lin)
 */

jscin.register_module('CrExtInp', jscin.extend_input_method({

  constructor: function (name, conf)
  {
    var self = this;
    self.opts = {
      OPT_KEEP_KEY_CASE: conf.keep_key_case
    };
    self.extension_id = conf.EXTENSION_ID;

    var flag = parseInt(conf.flag || "0");
    if (flag & 0x1) { // FLAG_KEEP_KEY_CASE
      self.opts.OPT_KEEP_KEY_CASE = true;
    }

    // TODO(hungte) Move the IM protocol to standalone JS.

    // Jscin IM protocol v1: (jscin/crext_inip.js)
    //  jscin->im: {type: 'jscin_im_v1', command: <command>, args: <args>}
    //  im->jscin: {type: 'jscin_im_v1, command: <command>, result: <result> }
    self.kJscinType = 'jscin_im_v1';

    chrome.runtime.onMessageExternal.addListener(
        function (request, sender, senderResponse) {
          if (sender.id != self.extension_id)
            return;
          if (request.type != self.kJscinType)
              return;
          if (request.command != 'keystroke') {
            jscin.log("unsupported command from extension", request.command);
            return;
          }
          var data = request.result;
          jscin.log("crext_inp received", data);
          self.ctx.keystroke = data.keystroke || '';
          self.ctx.mcch = data.mcch || '';
          self.ctx.cch = data.cch || '';
          self.ctx.lcch = data.lcch || [];
          self.ctx.edit_pos = data.edit_pos;
          self.notify();
        });
  },

  keystroke: function (ctx, ev, k)
  {
    var self = this;
    if (self.opts.OPT_KEEP_KEY_CASE && k.toLowerCase() == ev.key)
      k = ev.key;

    chrome.runtime.sendMessage(self.extension_id, {
      type: self.kJscinType,
      command: 'keystroke',
      args: [ctx, ev, k]});

    // TODO prevent race condition.
    self.ctx = ctx;
    return jscin.IMKEY_DELAY;
  },

  get_accepted_keys: function (ctx)
  {
    // TODO(hungte) Add more?
    return this.super.get_accepted_keys.call(this, ctx);
  }
}));
