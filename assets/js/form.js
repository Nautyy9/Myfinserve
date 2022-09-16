var qsProxy = {};

function FrameBuilder(formId, appendTo, initialHeight, iframeCode, title, embedStyleJSON) {
    this.formId = formId;
    this.initialHeight = initialHeight;
    this.iframeCode = iframeCode;
    this.frame = null;
    this.timeInterval = 200;
    this.appendTo = appendTo || false;
    this.formSubmitted = 0;
    this.frameMinWidth = '100%';
    this.defaultHeight = '';
    this.init = function () {
        this.embedURLHash = this.getMD5(window.location.href);
        if (embedStyleJSON && (embedStyleJSON[this.embedURLHash] && embedStyleJSON[this.embedURLHash]['inlineStyle']['embedWidth'])) {
            this.frameMinWidth = embedStyleJSON[this.embedURLHash]['inlineStyle']['embedWidth'] + 'px';
        }
        if (embedStyleJSON && (embedStyleJSON[this.embedURLHash])) {
            if (embedStyleJSON[this.embedURLHash]['inlineStyle'] && embedStyleJSON[this.embedURLHash]['inlineStyle']['embedHeight']) {
                this.defaultHeight = 'data-frameHeight="' + embedStyleJSON[this.embedURLHash]['inlineStyle']['embedHeight'] + '"';
            }
        }
        this.createFrame();
        this.addFrameContent(this.iframeCode);
    };
    this.createFrame = function () {
        var tmp_is_ie = !!window.ActiveXObject;
        this.iframeDomId = document.getElementById(this.formId) ? this.formId + '_' + new Date().getTime() : this.formId;
        var htmlCode = "<" + "iframe title=\"" + title.replace(/[\\"']/g, '\\$&').replace(/&amp;/g, '&') + "\" src=\"\" allowtransparency=\"true\" allow=\"geolocation; microphone; camera\" allowfullscreen=\"true\" name=\"" + this.formId + "\" id=\"" + this.iframeDomId + "\" style=\"width: 10px; min-width:" + this.frameMinWidth + "; display: block; overflow: hidden; height:" + this.initialHeight + "px; border: none;\" scrolling=\"no\"" + this.defaultHeight + "></if" + "rame>";
        if (this.appendTo === false) {
            document.write(htmlCode);
        } else {
            var tmp = document.createElement('div');
            tmp.innerHTML = htmlCode;
            var a = this.appendTo;
            document.getElementById(a).appendChild(tmp.firstChild);
        }
        this.frame = document.getElementById(this.iframeDomId);
        if (tmp_is_ie === true) {
            try {
                var iframe = this.frame;
                var doc = iframe.contentDocument ? iframe.contentDocument : (iframe.contentWindow.document || iframe.document);
                doc.open();
                doc.write("");
            } catch (err) {
                this.frame.src = "javascript:void((function(){document.open();document.domain=\'" + this.getBaseDomain() + "\';document.close();})())";
            }
        }
        this.addEvent(this.frame, 'load', this.bindMethod(this.setTimer, this));
        var self = this;
        if (window.chrome !== undefined) {
            this.frame.onload = function () {
                try {
                    var doc = this.contentWindow.document;
                    var _jotform = this.contentWindow.JotForm;
                    if (doc !== undefined) {
                        var form = doc.getElementById("" + self.iframeDomId);
                        self.addEvent(form, "submit", function () {
                            if (_jotform.validateAll()) {
                                self.formSubmitted = 1;
                            }
                        });
                    }
                } catch (e) {}
            }
        }
    };
    this.addEvent = function (obj, type, fn) {
        if (obj.attachEvent) {
            obj["e" + type + fn] = fn;
            obj[type + fn] = function () {
                obj["e" + type + fn](window.event);
            };
            obj.attachEvent("on" + type, obj[type + fn]);
        } else {
            obj.addEventListener(type, fn, false);
        }
    };
    this.addFrameContent = function (string) {
        if (window.location.search && window.location.search.indexOf('disableSmartEmbed') > -1) {
            string = string.replace(new RegExp('smartEmbed=1(?:&amp;|&)'), '');
            string = string.replace(new RegExp('isSmartEmbed'), '');
        } else {
            var cssLink = 'stylebuilder/' + this.formId + '.css';
            var cssPlace = string.indexOf(cssLink);
            var prepend = string[cssPlace + cssLink.length] === '?' ? '&amp;' : '?';
            var embedUrl = prepend + 'embedUrl=' + window.location.href;
            if (cssPlace > -1) {
                var positionLastRequestElement = string.indexOf('\"/>', cssPlace);
                if (positionLastRequestElement > -1) {
                    string = string.substr(0, positionLastRequestElement) + embedUrl + string.substr(positionLastRequestElement);
                    string = string.replace(cssLink, 'stylebuilder/' + this.formId + '/' + this.embedURLHash + '.css');
                }
            }
        }
        string = string.replace(new RegExp('src\\=\\"[^"]*captcha.php\"><\/scr' + 'ipt>', 'gim'), 'src="http://api.recaptcha.net/js/recaptcha_ajax.js"></scr' + 'ipt><' + 'div id="recaptcha_div"><' + '/div>' + '<' + 'style>#recaptcha_logo{ display:none;} #recaptcha_tagline{display:none;} #recaptcha_table{border:none !important;} .recaptchatable .recaptcha_image_cell, #recaptcha_table{ background-color:transparent !important; } <' + '/style>' + '<' + 'script defer="defer"> window.onload = function(){ Recaptcha.create("6Ld9UAgAAAAAAMon8zjt30tEZiGQZ4IIuWXLt1ky", "recaptcha_div", {theme: "clean",tabindex: 0,callback: function (){' + 'if (document.getElementById("uword")) { document.getElementById("uword").parentNode.removeChild(document.getElementById("uword")); } if (window["validate"] !== undefined) { if (document.getElementById("recaptcha_response_field")){ document.getElementById("recaptcha_response_field").onblur = function(){ validate(document.getElementById("recaptcha_response_field"), "Required"); } } } if (document.getElementById("recaptcha_response_field")){ document.getElementsByName("recaptcha_challenge_field")[0].setAttribute("name", "anum"); } if (document.getElementById("recaptcha_response_field")){ document.getElementsByName("recaptcha_response_field")[0].setAttribute("name", "qCap"); }}})' + ' }<' + '/script>');
        string = string.replace(/(type="text\/javascript">)\s+(validate\(\"[^"]*"\);)/, '$1 jTime = setInterval(function(){if("validate" in window){$2clearTimeout(jTime);}}, 1000);');
        if (string.match('#sublabel_litemode')) {
            string = string.replace('class="form-all"', 'class="form-all" style="margin-top:0;"');
        }
        var iframe = this.frame;
        var doc = iframe.contentDocument ? iframe.contentDocument : (iframe.contentWindow.document || iframe.document);
        doc.open();
        doc.write(string);
        setTimeout(function () {
            doc.close();
            try {
                if ('JotFormFrameLoaded' in window) {
                    JotFormFrameLoaded();
                }
            } catch (e) {}
        }, 200);
    };
    this.setTimer = function () {
        var self = this;
        this.interval = setTimeout(this.changeHeight.bind(this), this.timeInterval);
    };
    this.getBaseDomain = function () {
        var thn = window.location.hostname;
        var cc = 0;
        var buff = "";
        for (var i = 0; i < thn.length; i++) {
            var chr = thn.charAt(i);
            if (chr == ".") {
                cc++;
            }
            if (cc == 0) {
                buff += chr;
            }
        }
        if (cc == 2) {
            thn = thn.replace(buff + ".", "");
        }
        return thn;
    }
    this.changeHeight = function () {
        var actualHeight = this.getBodyHeight();
        var currentHeight = this.getViewPortHeight();
        var skipAutoHeight = (this.frame.contentWindow) ? this.frame.contentWindow.document.querySelector('[data-welcome-view="true"]') : null;
        if (actualHeight === undefined) {
            this.frame.style.height = this.frameHeight;
            if (!this.frame.style.minHeight) {
                this.frame.style.minHeight = "100vh";
                if (!('nojump' in this.frame.contentWindow.document.get)) {
                    window.parent.scrollTo(0, 0);
                }
            } else if (!this.frame.dataset.parentScrolled) {
                this.frame.dataset.parentScrolled = true;
                var container = window.parent.document && window.parent.document.querySelector('.jt-content');
                if (container && !('nojump' in window.parent.document.get)) {
                    container.scrollTo(0, 0);
                }
            }
        } else if (Math.abs(actualHeight - currentHeight) > 18 && !skipAutoHeight) {
            this.frame.style.height = (actualHeight) + "px";
        }
        this.setTimer();
    };
    this.bindMethod = function (method, scope) {
        return function () {
            method.apply(scope, arguments);
        };
    };
    this.frameHeight = 0;
    this.getBodyHeight = function () {
        if (this.formSubmitted === 1) {
            return;
        }
        var height;
        var scrollHeight;
        var offsetHeight;
        try {
            if (this.frame.contentWindow.document.height) {
                height = this.frame.contentWindow.document.height;
                if (this.frame.contentWindow.document.body.scrollHeight) {
                    height = scrollHeight = this.frame.contentWindow.document.body.scrollHeight;
                }
                if (this.frame.contentWindow.document.body.offsetHeight) {
                    height = offsetHeight = this.frame.contentWindow.document.body.offsetHeight;
                }
            } else if (this.frame.contentWindow.document.body) {
                if (this.frame.contentWindow.document.body.offsetHeight) {
                    height = offsetHeight = this.frame.contentWindow.document.body.offsetHeight;
                }
                var formWrapper = this.frame.contentWindow.document.querySelector('.form-all');
                var margin = parseInt(getComputedStyle(formWrapper).marginTop, 10);
                if (!isNaN(margin)) {
                    height += margin;
                }
            }
        } catch (e) {}
        this.frameHeight = height;
        return height;
    };
    this.getViewPortHeight = function () {
        if (this.formSubmitted === 1) {
            return;
        }
        var height = 0;
        try {
            if (this.frame.contentWindow.window.innerHeight) {
                height = this.frame.contentWindow.window.innerHeight - 18;
            } else if ((this.frame.contentWindow.document.documentElement) && (this.frame.contentWindow.document.documentElement.clientHeight)) {
                height = this.frame.contentWindow.document.documentElement.clientHeight;
            } else if ((this.frame.contentWindow.document.body) && (this.frame.contentWindow.document.body.clientHeight)) {
                height = this.frame.contentWindow.document.body.clientHeight;
            }
        } catch (e) {}
        return height;
    };
    this.getMD5 = function (s) {
        function L(k, d) {
            return (k << d) | (k >>> (32 - d))
        }

        function K(G, k) {
            var I, d, F, H, x;
            F = (G & 2147483648);
            H = (k & 2147483648);
            I = (G & 1073741824);
            d = (k & 1073741824);
            x = (G & 1073741823) + (k & 1073741823);
            if (I & d) {
                return (x ^ 2147483648 ^ F ^ H)
            }
            if (I | d) {
                if (x & 1073741824) {
                    return (x ^ 3221225472 ^ F ^ H)
                } else {
                    return (x ^ 1073741824 ^ F ^ H)
                }
            } else {
                return (x ^ F ^ H)
            }
        }

        function r(d, F, k) {
            return (d & F) | ((~d) & k)
        }

        function q(d, F, k) {
            return (d & k) | (F & (~k))
        }

        function p(d, F, k) {
            return (d ^ F ^ k)
        }

        function n(d, F, k) {
            return (F ^ (d | (~k)))
        }

        function u(G, F, aa, Z, k, H, I) {
            G = K(G, K(K(r(F, aa, Z), k), I));
            return K(L(G, H), F)
        }

        function f(G, F, aa, Z, k, H, I) {
            G = K(G, K(K(q(F, aa, Z), k), I));
            return K(L(G, H), F)
        }

        function D(G, F, aa, Z, k, H, I) {
            G = K(G, K(K(p(F, aa, Z), k), I));
            return K(L(G, H), F)
        }

        function t(G, F, aa, Z, k, H, I) {
            G = K(G, K(K(n(F, aa, Z), k), I));
            return K(L(G, H), F)
        }

        function e(G) {
            var Z;
            var F = G.length;
            var x = F + 8;
            var k = (x - (x % 64)) / 64;
            var I = (k + 1) * 16;
            var aa = Array(I - 1);
            var d = 0;
            var H = 0;
            while (H < F) {
                Z = (H - (H % 4)) / 4;
                d = (H % 4) * 8;
                aa[Z] = (aa[Z] | (G.charCodeAt(H) << d));
                H++
            }
            Z = (H - (H % 4)) / 4;
            d = (H % 4) * 8;
            aa[Z] = aa[Z] | (128 << d);
            aa[I - 2] = F << 3;
            aa[I - 1] = F >>> 29;
            return aa
        }

        function B(x) {
            var k = "",
                F = "",
                G, d;
            for (d = 0; d <= 3; d++) {
                G = (x >>> (d * 8)) & 255;
                F = "0" + G.toString(16);
                k = k + F.substr(F.length - 2, 2)
            }
            return k
        }

        function J(k) {
            k = k.replace(/rn/g, "n");
            var d = "";
            for (var F = 0; F < k.length; F++) {
                var x = k.charCodeAt(F);
                if (x < 128) {
                    d += String.fromCharCode(x)
                } else {
                    if ((x > 127) && (x < 2048)) {
                        d += String.fromCharCode((x >> 6) | 192);
                        d += String.fromCharCode((x & 63) | 128)
                    } else {
                        d += String.fromCharCode((x >> 12) | 224);
                        d += String.fromCharCode(((x >> 6) & 63) | 128);
                        d += String.fromCharCode((x & 63) | 128)
                    }
                }
            }
            return d
        }
        var C = Array();
        var P, h, E, v, g, Y, X, W, V;
        var S = 7,
            Q = 12,
            N = 17,
            M = 22;
        var A = 5,
            z = 9,
            y = 14,
            w = 20;
        var o = 4,
            m = 11,
            l = 16,
            j = 23;
        var U = 6,
            T = 10,
            R = 15,
            O = 21;
        s = J(s);
        C = e(s);
        Y = 1732584193;
        X = 4023233417;
        W = 2562383102;
        V = 271733878;
        for (P = 0; P < C.length; P += 16) {
            h = Y;
            E = X;
            v = W;
            g = V;
            Y = u(Y, X, W, V, C[P + 0], S, 3614090360);
            V = u(V, Y, X, W, C[P + 1], Q, 3905402710);
            W = u(W, V, Y, X, C[P + 2], N, 606105819);
            X = u(X, W, V, Y, C[P + 3], M, 3250441966);
            Y = u(Y, X, W, V, C[P + 4], S, 4118548399);
            V = u(V, Y, X, W, C[P + 5], Q, 1200080426);
            W = u(W, V, Y, X, C[P + 6], N, 2821735955);
            X = u(X, W, V, Y, C[P + 7], M, 4249261313);
            Y = u(Y, X, W, V, C[P + 8], S, 1770035416);
            V = u(V, Y, X, W, C[P + 9], Q, 2336552879);
            W = u(W, V, Y, X, C[P + 10], N, 4294925233);
            X = u(X, W, V, Y, C[P + 11], M, 2304563134);
            Y = u(Y, X, W, V, C[P + 12], S, 1804603682);
            V = u(V, Y, X, W, C[P + 13], Q, 4254626195);
            W = u(W, V, Y, X, C[P + 14], N, 2792965006);
            X = u(X, W, V, Y, C[P + 15], M, 1236535329);
            Y = f(Y, X, W, V, C[P + 1], A, 4129170786);
            V = f(V, Y, X, W, C[P + 6], z, 3225465664);
            W = f(W, V, Y, X, C[P + 11], y, 643717713);
            X = f(X, W, V, Y, C[P + 0], w, 3921069994);
            Y = f(Y, X, W, V, C[P + 5], A, 3593408605);
            V = f(V, Y, X, W, C[P + 10], z, 38016083);
            W = f(W, V, Y, X, C[P + 15], y, 3634488961);
            X = f(X, W, V, Y, C[P + 4], w, 3889429448);
            Y = f(Y, X, W, V, C[P + 9], A, 568446438);
            V = f(V, Y, X, W, C[P + 14], z, 3275163606);
            W = f(W, V, Y, X, C[P + 3], y, 4107603335);
            X = f(X, W, V, Y, C[P + 8], w, 1163531501);
            Y = f(Y, X, W, V, C[P + 13], A, 2850285829);
            V = f(V, Y, X, W, C[P + 2], z, 4243563512);
            W = f(W, V, Y, X, C[P + 7], y, 1735328473);
            X = f(X, W, V, Y, C[P + 12], w, 2368359562);
            Y = D(Y, X, W, V, C[P + 5], o, 4294588738);
            V = D(V, Y, X, W, C[P + 8], m, 2272392833);
            W = D(W, V, Y, X, C[P + 11], l, 1839030562);
            X = D(X, W, V, Y, C[P + 14], j, 4259657740);
            Y = D(Y, X, W, V, C[P + 1], o, 2763975236);
            V = D(V, Y, X, W, C[P + 4], m, 1272893353);
            W = D(W, V, Y, X, C[P + 7], l, 4139469664);
            X = D(X, W, V, Y, C[P + 10], j, 3200236656);
            Y = D(Y, X, W, V, C[P + 13], o, 681279174);
            V = D(V, Y, X, W, C[P + 0], m, 3936430074);
            W = D(W, V, Y, X, C[P + 3], l, 3572445317);
            X = D(X, W, V, Y, C[P + 6], j, 76029189);
            Y = D(Y, X, W, V, C[P + 9], o, 3654602809);
            V = D(V, Y, X, W, C[P + 12], m, 3873151461);
            W = D(W, V, Y, X, C[P + 15], l, 530742520);
            X = D(X, W, V, Y, C[P + 2], j, 3299628645);
            Y = t(Y, X, W, V, C[P + 0], U, 4096336452);
            V = t(V, Y, X, W, C[P + 7], T, 1126891415);
            W = t(W, V, Y, X, C[P + 14], R, 2878612391);
            X = t(X, W, V, Y, C[P + 5], O, 4237533241);
            Y = t(Y, X, W, V, C[P + 12], U, 1700485571);
            V = t(V, Y, X, W, C[P + 3], T, 2399980690);
            W = t(W, V, Y, X, C[P + 10], R, 4293915773);
            X = t(X, W, V, Y, C[P + 1], O, 2240044497);
            Y = t(Y, X, W, V, C[P + 8], U, 1873313359);
            V = t(V, Y, X, W, C[P + 15], T, 4264355552);
            W = t(W, V, Y, X, C[P + 6], R, 2734768916);
            X = t(X, W, V, Y, C[P + 13], O, 1309151649);
            Y = t(Y, X, W, V, C[P + 4], U, 4149444226);
            V = t(V, Y, X, W, C[P + 11], T, 3174756917);
            W = t(W, V, Y, X, C[P + 2], R, 718787259);
            X = t(X, W, V, Y, C[P + 9], O, 3951481745);
            Y = K(Y, h);
            X = K(X, E);
            W = K(W, v);
            V = K(V, g)
        }
        var i = B(Y) + B(X) + B(W) + B(V);
        return i.toLowerCase()
    };
    this.init();
}
FrameBuilder.get = qsProxy || [];
var i221232877924056 = new FrameBuilder("221232877924056", false, "", "<!DOCTYPE HTML PUBLIC \"-\/\/W3C\/\/DTD HTML 4.01\/\/EN\" \"http:\/\/www.w3.org\/TR\/html4\/strict.dtd\">\n<html lang=\"en-US\"  class=\"supernova\"><head>\n<meta http-equiv=\"Content-Type\" content=\"text\/html; charset=utf-8\" \/>\n<link rel=\"alternate\" type=\"application\/json+oembed\" href=\"https:\/\/www.jotform.com\/oembed\/?format=json&amp;url=https%3A%2F%2Fform.jotform.com%2F221232877924056\" title=\"oEmbed Form\">\n<link rel=\"alternate\" type=\"text\/xml+oembed\" href=\"https:\/\/www.jotform.com\/oembed\/?format=xml&amp;url=https%3A%2F%2Fform.jotform.com%2F221232877924056\" title=\"oEmbed Form\">\n<meta property=\"og:title\" content=\"Contact Us\" >\n<meta property=\"og:url\" content=\"https:\/\/form.jotform.com\/221232877924056\" >\n<meta property=\"og:description\" content=\"Please click the link to complete this form.\" >\n<meta name=\"slack-app-id\" content=\"AHNMASS8M\">\n<link rel=\"shortcut icon\" href=\"https:\/\/cdn.jotfor.ms\/assets\/img\/favicons\/favicon-2021.svg\">\n<link rel=\"canonical\" href=\"https:\/\/form.jotform.com\/221232877924056\" \/>\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, maximum-scale=2.0, user-scalable=1\" \/>\n<meta name=\"HandheldFriendly\" content=\"true\" \/>\n<title>Contact Us<\/title>\n<style type=\"text\/css\">@media print{.form-section{display:inline!important}.form-pagebreak{display:none!important}.form-section-closed{height:auto!important}.page-section{position:initial!important}}<\/style>\n<link type=\"text\/css\" rel=\"stylesheet\" href=\"https:\/\/cdn01.jotfor.ms\/themes\/CSS\/5e6b428acc8c4e222d1beb91.css?themeRevisionID=5f7ed99c2c2c7240ba580251\"\/>\n<link type=\"text\/css\" rel=\"stylesheet\" href=\"https:\/\/cdn02.jotfor.ms\/css\/styles\/payment\/payment_styles.css?3.3.33048\" \/>\n<link type=\"text\/css\" rel=\"stylesheet\" href=\"https:\/\/cdn03.jotfor.ms\/css\/styles\/payment\/payment_feature.css?3.3.33048\" \/>\n<style type=\"text\/css\" id=\"form-designer-style\">\n    \/* Injected CSS Code *\/\n\n  \n  \n  \n  \/*PREFERENCES STYLE*\/\n  \/* NEW THEME STYLE *\/\n\n  \/* colors *\/\n\n  .form-textbox, .form-textarea {\n    color: undefined;\n  }\n  .rating-item input:hover+label {\n    color: #2e69ff;\n  }\n  li[data-type=control_fileupload] .qq-upload-button,\n  .until-text,\n  .form-submit-reset {\n    color: #2c3345;\n  }\n\n  .stageEmpty.isSmall{\n    color: #CAD0CF;\n  }\n\n  .rating-item label {\n    color: #b8bdc9;\n  }\n  .currentDate,\n  .pickerItem select,\n  .appointmentCalendar .calendarDay,\n  .calendar.popup th,\n  .calendar.popup table tbody td,\n  .calendar-new-header>*,\n  .form-collapse-table {\n    color: #2C3345;\n  }\n  .appointmentCalendar .dayOfWeek {\n    color: #2e69ff;\n  }\n  .appointmentSlotsContainer > * {\n    color: #2e69ff;\n  }\n  li[data-type=control_fileupload] .jfUpload-heading,\n  ::placeholder,\n  .form-dropdown.is-active,\n  .form-dropdown:first-child,\n  .form-spinner-input {\n    color: #57647e;\n  }\n  .appointmentCalendar .calendarWeek .calendarDay.isUnavailable,\n  .calendar tr.days td.otherDay,\n  .calendar tr.days td:hover:not(.unselectable) {\n    color: #CAD0CF;\n  }\n  span.form-sub-label, label.form-sub-label, div.form-header-group .form-subHeader,\n  .rating-item-title.for-to > label:first-child,\n  .rating-item-title.for-from > label:first-child,\n  .rating-item-title .editor-container * {\n    color: #57647E;\n  }\n  .form-pagebreak-back{\n    color: #2c3345;\n  }\n  .rating-item input:checked+label,\n  .rating-item input:focus+label {\n    color: #FFFFFF;\n  }\n  .clear-pad-btn {\n    color: #57647e;\n  }\n  .form-textbox::placeholder,\n  .form-dropdown:not(.time-dropdown):not(:required),\n  .form-dropdown:not(:required),\n  .form-dropdown:required:invalid {\n    color: #57647e;\n  }\n  \/* border-colors *\/\n  .form-dropdown,\n  .form-textarea,\n  .form-textbox,\n  li[data-type=control_fileupload] .qq-upload-button,\n  .rating-item label,\n  .rating-item input:focus+label,\n  .rating-item input:checked+label,\n  .jf-form-buttons,\n  .form-checkbox+label:before, .form-checkbox+span:before, .form-radio+label:before, .form-radio+span:before,\n  .signature-pad-passive,\n  .signature-wrapper,\n  .appointmentCalendarContainer,\n  .appointmentField .timezonePickerName,\n  .appointmentDayPickerButton,\n  .appointmentCalendarContainer .monthYearPicker .pickerItem+.pickerItem,\n  .appointmentCalendarContainer .monthYearPicker,\n  .appointmentCalendar .calendarDay.isActive .calendarDayEach, .appointmentCalendar .calendarDay.isToday .calendarDayEach, .appointmentCalendar .calendarDay:not(.empty):hover .calendarDayEach,\n  .calendar.popup:before,\n  .calendar-new-month,\n  .form-matrix-column-headers, .form-matrix-table td, .form-matrix-table td:last-child,\n  .form-matrix-table th, .form-matrix-table th:last-child, .form-matrix-table tr:last-child td, .form-matrix-table tr:last-child th, .form-matrix-table tr:not([role=group])+tr[role=group] th,\n  .form-matrix-headers.form-matrix-column-headers,\n  .isSelected .form-matrix-column-headers:nth-last-of-type(2),\n  li[data-type=control_inline] input[type=email], li[data-type=control_inline] input[type=number],\n  li[data-type=control_inline] input[type=tel], li[data-type=control_inline] input[type=text],\n  .stageEmpty.isSmall {\n    border-color: #b8bdc9;\n  }\n  .rating-item input:hover+label {\n    border-color: #2e69ff;\n  }\n  .appointmentSlot,\n  .form-checkbox:checked+label:before, .form-checkbox:checked+span:before, .form-checkbox:checked+span label:before,\n  .form-radio:checked+label:before, .form-radio:checked+span:before,\n  .form-dropdown:focus, .form-textarea:focus, .form-textbox:focus, .signature-wrapper:focus,\n  .form-line[data-payment=\"true\"] .form-product-item .p_checkbox .checked,\n  .form-dropdown:hover, .form-textarea:hover, .form-textbox:hover, .signature-wrapper:hover {\n    border-color: #2e69ff;\n  }\n\n  .calendar tr.days td:hover:not(.unselectable):after {\n    border-color: #e5eaf4;\n  }\n  .form-header-group,\n  .form-buttons-wrapper, .form-pagebreak, .form-submit-clear-wrapper,\n  .form-pagebreak-next,\n  .form-pagebreak-back,\n  .form-checkbox:hover+label:before, .form-checkbox:hover+span:before, .form-radio:hover+label:before, .form-radio:hover+span:before,\n  .divider {\n    border-color: #F3F3FE;\n  }\n  .form-pagebreak-back:focus, .form-pagebreak-next:focus, .form-submit-button:focus {\n    border-color: rgba(46, 105, 255, 1);\n  }\n  \/* background-colors *\/\n  .form-line-active {\n    background-color: #F1F5FF;\n  }\n  .form-line-error {\n    background-color: #FFD6D6;\n  }\n  .form-matrix-column-headers, .form-matrix-row-headers,\n  .form-spinner-button-container>*,\n  .form-collapse-table,\n  .form-collapse-table:hover,\n  .appointmentDayPickerButton {\n    background-color: #e5eaf4;\n  }\n  .calendar.popup, .calendar.popup table,\n  .calendar.popup table tbody td:after{\n    background-color: #FFFFFF;\n  }\n\n  .appointmentCalendar .calendarDay.isActive .calendarDayEach,\n  .appointmentFieldRow.forSelectedDate,\n  .calendar.popup tr.days td.selected:after,\n  .calendar.popup:after,\n  .submit-button,\n  .form-checkbox:checked+label:before, .form-checkbox:checked+span:before, .form-checkbox:checked+span label:before,\n  .form-radio+label:after, .form-radio+span:after,\n  .rating-item input:checked+label,\n  .appointmentCalendar .calendarDay:after,\n  .form-line[data-payment=\"true\"] .form-product-item .p_checkbox .checked,\n  .rating-item input:focus+label {\n    background-color: #2e69ff;\n  }\n  .appointmentSlot.active {\n    background-color: #2e69ff !important;\n  }\n  .clear-pad-btn,\n  .appointmentCalendar .dayOfWeek,\n  .calendar.popup th {\n    background-color: #eef3ff !important;\n  }\n  .appointmentField .timezonePicker:hover+.timezonePickerName,\n  .form-spinner-button-container>*:hover {\n    background-color: #eef3ff;\n  }\n  .form-matrix-values,\n  .form-matrix-values,\n  .signature-wrapper,\n  .signature-pad-passive,\n  .rating-item label,\n  .form-checkbox+label:before, .form-checkbox+span:before,\n  .form-radio+label:before, .form-radio+span:before {\n    background-color: #FFFFFF;\n  }\n  li[data-type=control_fileupload] .qq-upload-button {\n    background-color: #fbfcff;\n  }\n  .JotFormBuilder .appContainer #app li.form-line[data-type=control_matrix].isSelected\n  .questionLine-editButton.forRemove:after, \n  .JotFormBuilder .appContainer #app li.form-line[data-type=control_matrix].isSelected .questionLine-editButton.forRemove:before {\n    background-color: #FFFFFF;\n  }\n  .appointmentCalendarContainer, .appointmentSlot,\n  .rating-item-title.for-to > label:first-child,\n  .rating-item-title.for-from > label:first-child,\n  .rating-item-title .editor-container *,\n  .calendar-opened {\n    background-color: transparent;\n  }\n  .page-section li.form-line-active[data-type=\"control_button\"] {\n    background-color: #F1F5FF;\n  }\n  .appointmentCalendar .calendarDay.isSelected:after {\n    color: #FFFFFF;\n  }\n  \/* shadow *\/\n  .form-dropdown:hover, .form-textarea:hover, .form-textbox:hover, .signature-wrapper:hover,\n  .calendar.popup:before,\n  .jSignature:hover,\n  li[data-type=control_fileupload] .qq-upload-button-hover,\n  .form-line[data-payment=\"true\"] .form-product-item .p_checkbox .checked,\n  .form-line[data-payment=\"true\"] .form-product-item .p_checkbox:hover .select_border,\n  .form-checkbox:hover+label:before, .form-checkbox:hover+span:before, .form-radio:hover+label:before, .form-radio:hover+span:before,\n  .calendar.popup:before {\n    border-color: rgba(46, 105, 255, 0.5);\n    box-shadow: 0 0 0 2px rgba(46, 105, 255, 0.25);\n  }\n  .form-dropdown:focus, .form-textarea:focus, .form-textbox:focus, .signature-wrapper:focus,\n  li[data-type=control_fileupload] .qq-upload-button-focus,\n  .form-checkbox:focus+label:before, .form-checkbox:focus+span:before, .form-radio:focus+label:before, .form-radio:focus+span:before,\n  .calendar.popup:before {\n    border-color: rgba(46, 105, 255, 1);\n    box-shadow: 0 0 0 3px rgba(46, 105, 255, 0.25);\n  }\n  .calendar.popup table tbody td{\n    box-shadow: none;\n  }\n\n  \/* button colors *\/\n  .submit-button {\n    background-color: #18BD5B;\n    border-color: #18BD5B;\n  }\n  .submit-button:hover {\n    background-color: #16AA52;\n    border-color: #16AA52;\n  }\n  .form-pagebreak-next {\n    background-color: #2e69ff;\n  }\n  .form-pagebreak-back {\n    background-color: #e5e7f2;\n  }\n  .form-pagebreak-back:hover {\n    background-color: #CED0DA;\n    border-color: #CED0DA;\n  }\n  .form-pagebreak-next:hover {\n    background-color: #2554CC;\n    border-color: #2554CC;\n  }\n  .form-sacl-button, .form-submit-print {\n    background-color: transparent;\n    color: #2c3345;\n    border-color: #b8bdc9;\n  }\n  .form-sacl-button:hover, .form-submit-print:hover,\n  .appointmentSlot:not(.disabled):not(.active):hover,\n  .appointmentDayPickerButton:hover,\n  .rating-item input:hover+label {\n    background-color: #96B4FF;\n  }\n\n  \/* payment styles *\/\n  \n  .form-line[data-payment=true] .form-textbox,\n  .form-line[data-payment=true] .select-area,\n  .form-line[data-payment=true] #coupon-input,\n  .form-line[data-payment=true] #coupon-container input,\n  .form-line[data-payment=true] input#productSearch-input,\n  .form-line[data-payment=true] .form-product-category-item:after,\n  .form-line[data-payment=true] .filter-container .dropdown-container .select-content,\n  .form-line[data-payment=true] .form-textbox.form-product-custom_quantity,\n  .form-line[data-payment=\"true\"] .form-product-item .p_checkbox .select_border,\n  .form-line[data-payment=\"true\"] .form-product-item .form-product-container .form-sub-label-container span.select_cont,\n  .form-line[data-payment=true] select.form-dropdown,\n  .form-line[data-payment=true] #payment-category-dropdown .select-area,\n  .form-line[data-payment=true] #payment-sorting-products-dropdown .select-area,\n  .form-line[data-payment=true] .dropdown-container .select-content {\n    border-color: #b8bdc9;\n    border-color: undefined;\n  }\n  .form-line[data-payment=\"true\"] hr,\n  .form-line[data-payment=true] .p_item_separator,\n  .form-line[data-payment=\"true\"] .payment_footer.new_ui,\n  .form-line.card-3col .form-product-item.new_ui,\n  .form-line.card-2col .form-product-item.new_ui {\n    border-color: #b8bdc9;\n    border-color: undefined;\n  }\n  .form-line[data-payment=true] .form-product-category-item {\n    border-color: #b8bdc9;\n    border-color: undefined;\n  }\n  .form-line[data-payment=true] #coupon-input,\n  .form-line[data-payment=true] .form-textbox.form-product-custom_quantity,\n  .form-line[data-payment=true] input#productSearch-input,\n  .form-line[data-payment=true] .select-area,\n  .form-line[data-payment=true] .custom_quantity,\n  .form-line[data-payment=true] .filter-container .select-content,\n  .form-line[data-payment=true] .p_checkbox .select_border,\n  .form-line[data-payment=true] #payment-category-dropdown .select-area,\n  .form-line[data-payment=true] #payment-sorting-products-dropdown .select-area,\n  .form-line[data-payment=true] .dropdown-container .select-content {\n    background-color: #FFFFFF;\n  }\n  .form-line[data-payment=true] .form-product-category-item.title_collapsed.has_selected_product .selected-items-icon {\n   background-color: undefined;\n   border-color: undefined;\n  }\n  .form-line[data-payment=true].form-line.card-3col .form-product-item,\n  .form-line[data-payment=true].form-line.card-2col .form-product-item {\n   background-color: undefined;\n  }\n  .form-line[data-payment=true] .payment-form-table input.form-textbox,\n  .form-line[data-payment=true] .payment-form-table input.form-dropdown,\n  .form-line[data-payment=true] .payment-form-table .form-sub-label-container > div,\n  .form-line[data-payment=true] .payment-form-table span.form-sub-label-container iframe,\n  .form-line[data-type=control_square] .payment-form-table span.form-sub-label-container iframe {\n    border-color: #b8bdc9;\n  }\n\n  \/* icons *\/\n  .appointmentField .timezonePickerName:before {\n    background-image: url(data:image\/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0wIDcuOTYwMkMwIDMuNTY2MTcgMy41NTgyMSAwIDcuOTUyMjQgMEMxMi4zNTQyIDAgMTUuOTIwNCAzLjU2NjE3IDE1LjkyMDQgNy45NjAyQzE1LjkyMDQgMTIuMzU0MiAxMi4zNTQyIDE1LjkyMDQgNy45NTIyNCAxNS45MjA0QzMuNTU4MjEgMTUuOTIwNCAwIDEyLjM1NDIgMCA3Ljk2MDJaTTEuNTkzNzUgNy45NjAyQzEuNTkzNzUgMTEuNDc4NiA0LjQ0MzUgMTQuMzI4NCA3Ljk2MTkxIDE0LjMyODRDMTEuNDgwMyAxNC4zMjg0IDE0LjMzMDEgMTEuNDc4NiAxNC4zMzAxIDcuOTYwMkMxNC4zMzAxIDQuNDQxNzkgMTEuNDgwMyAxLjU5MjA0IDcuOTYxOTEgMS41OTIwNEM0LjQ0MzUgMS41OTIwNCAxLjU5Mzc1IDQuNDQxNzkgMS41OTM3NSA3Ljk2MDJaIiBmaWxsPSIjMTExMTExIi8+CjxwYXRoIGQ9Ik04LjM1ODA5IDMuOTgwNDdINy4xNjQwNlY4Ljc1NjU5TDExLjM0MzIgMTEuMjY0MUwxMS45NDAyIDEwLjI4NDlMOC4zNTgwOSA4LjE1OTU3VjMuOTgwNDdaIiBmaWxsPSIjMTExMTExIi8+Cjwvc3ZnPgo=);\n  }\n  .appointmentCalendarContainer .monthYearPicker .pickerArrow.prev:after {\n    background-image: url(data:image\/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iNiIgdmlld0JveD0iMCAwIDEwIDYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik04LjU5NzgyIDUuMzMyNzNDOC45MzMxMiA1LjYzNjI3IDkuNDM5MzkgNS42Mjk2OSA5Ljc1NjEzIDUuMzEyNzhDMTAuMDgxMyA0Ljk4NzQ1IDEwLjA4MTMgNC40NTk2MyA5Ljc1NjEzIDQuMTM0M0M5LjYwOTA0IDMuOTk2MzUgOS42MDkwMyAzLjk5NjM1IDkuMDg5NDkgMy41MTExOEM4LjQzNzQyIDIuOTAyMTggOC40Mzc0MyAyLjkwMjE4IDcuNjU1MTEgMi4xNzE1NkM2LjA4OTU2IDAuNzA5NDQ3IDYuMDg5NTYgMC43MDk0NDYgNS41Njc3MyAwLjIyMjEwMUM1LjI0MTA0IC0wLjA3NDUwNjcgNC43NTA4NSAtMC4wNzM1MDMgNC40MzIzNSAwLjIyMTkyOUwwLjI2MjU0IDQuMTE0MjRDLTAuMDgwNTQ1OSA0LjQ1NTQ1IC0wLjA4NzE3MTEgNC45ODM5NyAwLjI0MTQ2OCA1LjMxMjc4QzAuNTU5NTU4IDUuNjMxMDUgMS4wNjk3NSA1LjYzNjY4IDEuMzk3MDMgNS4zMzI2Mkw0Ljk5ODkxIDEuOTcxMzFMOC41OTc4MiA1LjMzMjczWiIgZmlsbD0iI0NGQ0ZDRiIvPgo8L3N2Zz4K);\n  }\n  .appointmentCalendarContainer .monthYearPicker .pickerArrow.next:after {\n    background-image: url(data:image\/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iNiIgdmlld0JveD0iMCAwIDEwIDYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xLjQwMjE4IDAuMjIzNDk3QzEuMDY2ODcgLTAuMDgwMTAyOCAwLjU2MDYwMiAtMC4wNzM1MDI4IDAuMjQzODY5IDAuMjQzMzk3Qy0wLjA4MTI4OTggMC41Njg2OTcgLTAuMDgxMjg5OCAxLjA5NjYgMC4yNDM4NjkgMS40MjE5QzAuMzkwOTU2IDEuNTU5OCAwLjM5MDk2NiAxLjU1OTggMC45MTA1MSAyLjA0NUMxLjU2MjU3IDIuNjU0IDEuNTYyNTYgMi42NTQgMi4zNDQ4OCAzLjM4NDZDMy45MTA0NCA0Ljg0NjcgMy45MTA0MyA0Ljg0NjcgNC40MzIyNyA1LjMzNDFDNC43NTg5NSA1LjYzMDcgNS4yNDkxNSA1LjYyOTcgNS41Njc2NCA1LjMzNDNMOS43Mzc0NiAxLjQ0MkMxMC4wODA1IDEuMTAwNyAxMC4wODcxIDAuNTcyMTk3IDkuNzU4NTMgMC4yNDMzOTdDOS40NDA0NCAtMC4wNzQ5MDI4IDguOTMwMjQgLTAuMDgwNTAyOCA4LjYwMjk3IDAuMjIzNTk3TDUuMDAxMDggMy41ODQ5TDEuNDAyMTggMC4yMjM0OTdaIiBmaWxsPSIjQ0ZDRkNGIi8+Cjwvc3ZnPgo=);\n  }\n  .appointmentField .timezonePickerName:after {\n    background-image: url(data:image\/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iNiIgdmlld0JveD0iMCAwIDEwIDYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wLjA1Mjk5IDAuMjM2NTcyQzAuMDExMzU0NiAwLjMwNzc4NSAtMC4wMDYzMDI4MiAwLjM4NzUzNCAwLjAwMTk5OTIzIDAuNDY2ODdDMC4wMTAzMDEzIDAuNTQ2MjA2IDAuMDQ0MjM0MyAwLjYyMTk4OSAwLjA5OTk5MDEgMC42ODU3MTVMNC41OTk5OSA1LjgyODU3QzQuNjQ2NTcgNS44ODE4IDQuNzA2OTYgNS45MjUgNC43NzYzOSA1Ljk1NDc1QzQuODQ1ODIgNS45ODQ1MSA0LjkyMjM3IDYgNC45OTk5OSA2QzUuMDc3NjIgNiA1LjE1NDE3IDUuOTg0NTEgNS4yMjM2IDUuOTU0NzVDNS4yOTMwMyA1LjkyNSA1LjM1MzQyIDUuODgxOCA1LjQgNS44Mjg1N0w5LjkgMC42ODU3MTRDOS45NjQ5MSAwLjYxMTUzIDEwIDAuNTIxMzAxIDEwIDAuNDI4NTcxQzkuOTk5NzEgMC4zNjE5MzggOS45ODE1NyAwLjI5NjI1MiA5Ljk0NyAwLjIzNjU3MUM5LjkwNTQzIDAuMTY1NDc0IDkuODQxNjEgMC4xMDU2OTEgOS43NjI2NyAwLjA2MzkxMTVDOS42ODM3MyAwLjAyMjEzMTcgOS41OTI3OCAyLjYwNjg5ZS0wNiA5LjUgLTUuNzYzMDNlLTA4TDAuNDk5OTkgMy4zNTc3M2UtMDdDMC40MDcyMTIgMy4wMDg0ZS0wNiAwLjMxNjI2NCAwLjAyMjEzMjEgMC4yMzczMjEgMC4wNjM5MTE5QzAuMTU4Mzc5IDAuMTA1NjkyIDAuMDk0NTU0NyAwLjE2NTQ3NCAwLjA1Mjk5IDAuMjM2NTcyVjAuMjM2NTcyWiIgZmlsbD0iIzExMTExMSIvPgo8L3N2Zz4K);\n    width: 11px;\n  }\n  li[data-type=control_datetime] [data-wrapper-react=true].extended>div+.form-sub-label-container .form-textbox:placeholder-shown,\n  li[data-type=control_datetime] [data-wrapper-react=true]:not(.extended) .form-textbox:not(.time-dropdown):placeholder-shown,\n  .appointmentCalendarContainer .currentDate {\n    background-image: url(data:image\/svg+xml;base64,PHN2ZyB3aWR0aD0iMTciIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNyAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE1Ljk0ODkgNVYxNS4wMjZDMTUuOTQ4OSAxNS41NjM5IDE1LjUwMjYgMTYgMTQuOTUyMSAxNkgwLjk5NjgwNUMwLjQ0NjI4NSAxNiAwIDE1LjU2MzkgMCAxNS4wMjZWNUgxNS45NDg5Wk00LjE5MjQ1IDExLjQxNjdIMi4zNzQ3NEwyLjI4NTE1IDExLjQyNDdDMi4xMTA3OCAxMS40NTY1IDEuOTY4MDEgMTEuNTc5MiAxLjkwNzUyIDExLjc0MjJMMS44ODQzNyAxMS44MjY4TDEuODc2MzQgMTEuOTE2N1YxMy42NjY3TDEuODg0MzcgMTMuNzU2NUMxLjkxNjAyIDEzLjkzMTUgMi4wMzg0IDE0LjA3NDcgMi4yMDA4MyAxNC4xMzU0TDIuMjg1MTUgMTQuMTU4NkwyLjM3NDc0IDE0LjE2NjdINC4xOTI0NUw0LjI4MjAzIDE0LjE1ODZDNC40NTY0MSAxNC4xMjY5IDQuNTk5MTggMTQuMDA0MSA0LjY1OTY3IDEzLjg0MTFMNC42ODI4MiAxMy43NTY1TDQuNjkwODUgMTMuNjY2N1YxMS45MTY3TDQuNjgyODIgMTEuODI2OEM0LjY1MTE3IDExLjY1MTkgNC41Mjg3OSAxMS41MDg2IDQuMzY2MzUgMTEuNDQ3OUw0LjI4MjAzIDExLjQyNDdMNC4xOTI0NSAxMS40MTY3Wk04Ljg4MzI5IDExLjQxNjdINy4wNjU1OUw2Ljk3NiAxMS40MjQ3QzYuODAxNjIgMTEuNDU2NSA2LjY1ODg1IDExLjU3OTIgNi41OTgzNyAxMS43NDIyTDYuNTc1MjIgMTEuODI2OEw2LjU2NzE5IDExLjkxNjdWMTMuNjY2N0w2LjU3NTIyIDEzLjc1NjVDNi42MDY4NyAxMy45MzE1IDYuNzI5MjUgMTQuMDc0NyA2Ljg5MTY4IDE0LjEzNTRMNi45NzYgMTQuMTU4Nkw3LjA2NTU5IDE0LjE2NjdIOC44ODMyOUw4Ljk3Mjg4IDE0LjE1ODZDOS4xNDcyNiAxNC4xMjY5IDkuMjkwMDMgMTQuMDA0MSA5LjM1MDUxIDEzLjg0MTFMOS4zNzM2NyAxMy43NTY1TDkuMzgxNyAxMy42NjY3VjExLjkxNjdMOS4zNzM2NyAxMS44MjY4QzkuMzQyMDIgMTEuNjUxOSA5LjIxOTY0IDExLjUwODYgOS4wNTcyIDExLjQ0NzlMOC45NzI4OCAxMS40MjQ3TDguODgzMjkgMTEuNDE2N1pNNC4xOTI0NSA2LjgzMzMzSDIuMzc0NzRMMi4yODUxNSA2Ljg0MTM5QzIuMTEwNzggNi44NzMxNCAxLjk2ODAxIDYuOTk1OTEgMS45MDc1MiA3LjE1ODg3TDEuODg0MzcgNy4yNDM0NkwxLjg3NjM0IDcuMzMzMzNWOS4wODMzM0wxLjg4NDM3IDkuMTczMjFDMS45MTYwMiA5LjM0ODE1IDIuMDM4NCA5LjQ5MTM3IDIuMjAwODMgOS41NTIwNUwyLjI4NTE1IDkuNTc1MjhMMi4zNzQ3NCA5LjU4MzMzSDQuMTkyNDVMNC4yODIwMyA5LjU3NTI4QzQuNDU2NDEgOS41NDM1MyA0LjU5OTE4IDkuNDIwNzUgNC42NTk2NyA5LjI1NzhMNC42ODI4MiA5LjE3MzIxTDQuNjkwODUgOS4wODMzM1Y3LjMzMzMzTDQuNjgyODIgNy4yNDM0NkM0LjY1MTE3IDcuMDY4NTIgNC41Mjg3OSA2LjkyNTI5IDQuMzY2MzUgNi44NjQ2MUw0LjI4MjAzIDYuODQxMzlMNC4xOTI0NSA2LjgzMzMzWk04Ljg4MzI5IDYuODMzMzNINy4wNjU1OUw2Ljk3NiA2Ljg0MTM5QzYuODAxNjIgNi44NzMxNCA2LjY1ODg1IDYuOTk1OTEgNi41OTgzNyA3LjE1ODg3TDYuNTc1MjIgNy4yNDM0Nkw2LjU2NzE5IDcuMzMzMzNWOS4wODMzM0w2LjU3NTIyIDkuMTczMjFDNi42MDY4NyA5LjM0ODE1IDYuNzI5MjUgOS40OTEzNyA2Ljg5MTY4IDkuNTUyMDVMNi45NzYgOS41NzUyOEw3LjA2NTU5IDkuNTgzMzNIOC44ODMyOUw4Ljk3Mjg4IDkuNTc1MjhDOS4xNDcyNiA5LjU0MzUzIDkuMjkwMDMgOS40MjA3NSA5LjM1MDUxIDkuMjU3OEw5LjM3MzY3IDkuMTczMjFMOS4zODE3IDkuMDgzMzNWNy4zMzMzM0w5LjM3MzY3IDcuMjQzNDZDOS4zNDIwMiA3LjA2ODUyIDkuMjE5NjQgNi45MjUyOSA5LjA1NzIgNi44NjQ2MUw4Ljk3Mjg4IDYuODQxMzlMOC44ODMyOSA2LjgzMzMzWk0xMy41NzQxIDYuODMzMzNIMTEuNzU2NEwxMS42NjY4IDYuODQxMzlDMTEuNDkyNSA2Ljg3MzE0IDExLjM0OTcgNi45OTU5MSAxMS4yODkyIDcuMTU4ODdMMTEuMjY2MSA3LjI0MzQ2TDExLjI1OCA3LjMzMzMzVjkuMDgzMzNMMTEuMjY2MSA5LjE3MzIxQzExLjI5NzcgOS4zNDgxNSAxMS40MjAxIDkuNDkxMzcgMTEuNTgyNSA5LjU1MjA1TDExLjY2NjggOS41NzUyOEwxMS43NTY0IDkuNTgzMzNIMTMuNTc0MUwxMy42NjM3IDkuNTc1MjhDMTMuODM4MSA5LjU0MzUzIDEzLjk4MDkgOS40MjA3NSAxNC4wNDE0IDkuMjU3OEwxNC4wNjQ1IDkuMTczMjFMMTQuMDcyNSA5LjA4MzMzVjcuMzMzMzNMMTQuMDY0NSA3LjI0MzQ2QzE0LjAzMjkgNy4wNjg1MiAxMy45MTA1IDYuOTI1MjkgMTMuNzQ4IDYuODY0NjFMMTMuNjYzNyA2Ljg0MTM5TDEzLjU3NDEgNi44MzMzM1oiIGZpbGw9IiM1ODY1N0MiLz4KPHBhdGggZD0iTTEzLjA1MjIgMS4xMjVIMTUuMDQ1OEMxNS41OTYzIDEuMTI1IDE2LjA0MjYgMS42MDA3IDE2LjA0MjYgMi4xODc1VjRIMC4wOTM3NVYyLjE4NzVDMC4wOTM3NSAxLjYwMDcgMC41NDAwMzUgMS4xMjUgMS4wOTA1NiAxLjEyNUgzLjA4NDE3VjEuMDYyNUMzLjA4NDE3IDAuNDc1Njk3IDMuNTMwNDUgMCA0LjA4MDk3IDBDNC42MzE0OSAwIDUuMDc3NzggMC40NzU2OTcgNS4wNzc3OCAxLjA2MjVWMS4xMjVIMTEuMDU4NlYxLjA2MjVDMTEuMDU4NiAwLjQ3NTY5NyAxMS41MDQ5IDAgMTIuMDU1NCAwQzEyLjYwNTkgMCAxMy4wNTIyIDAuNDc1Njk3IDEzLjA1MjIgMS4wNjI1VjEuMTI1WiIgZmlsbD0iIzU4NjU3QyIvPgo8L3N2Zz4K);\n  }\n  .form-star-rating-star.Stars {\n    background-image: url(data:image\/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAAAeCAYAAACrDxUoAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAvDSURBVHgB7VtLbBvXFb1vZjgiRdEmlcKWYQWlDLuo0QamC7SRW7sdpg0QO4uiaLsoGsBysq\/RbQtEYpCkyMpJurY+aLpogtbdSAaapGTzge1kYW4KJ0g\/TGpbNm2JlEiK5Pxe7x1xBIqixuIbkkKbHGDA+b13+O6cOe\/NuzMAX+AL\/K\/i3Q8+Ov\/etY8uwC4h\/9bo+XtvP\/y55b\/71uil3Yx\/6cTJ86snTvniZyCI9Ic3tKCkpGnd1M3kqRNHM9BHLL45qinqcIN\/OXng8ZsZ6CMcfoXaz8A0jf7z\/+XghCSxmX\/F0rsS\/8LJk1pg30ia47p5+04ydvW9DAhAAkEonE3G9kYgFo0AyGwS+gyZwWRo\/xmghdahzyDOcGQYwpHYrvBL0jrnrsWfw6T6zNMwgIuf9gsJkNxPkWUtMhSCSDgEtP7ulRsa9AnkPiwwrKmxR4EWWqd90Cc4\/LKihUIRoIXJgf7yo\/sFQ3vitL4b8Sf3k\/aPaIEzp4EWdmBEK4yf1EAAQgJ03c9Fv+9C1\/1c9NsFXfdz0W8XJPcjThd9j3\/D\/Vz4ccGOBdjsfi76eRc2u5+Lfrpgs\/u56KcLuu4ny4GNff2Mf7P7ufDjgh0LsNX9XPTrLmx1Pxf9csFW93PRLxdsdT8XfYt\/i\/u5EHXBjgTYzv1c9OMubOd+Lvrhgu3cz0U\/XLCd+7noR\/zbuZ8LURfcsQDT169H0f0utHM\/F+5dmL5yIw5dxr\/T0ajE4EI793PhuuBieiQOPeJv534uXBfsBT\/VuZ37uehl\/AuaFpVsuNDO\/Vy4LlgYH4\/DDrFpHpBEBkY4DmAlFGB78WCCry9RmbF4ZGgQHort8axwqbAKK6UKrvEiVp\/FOnIW55\/aMs+CreQgUMkljx8vtitLFzmM\/JYMCZmzvTawBAOeAMajjA3G1eFHYfDAjz351xb\/CPX7GWoYcWSxjhwnfmZlA7aUqyD\/WLLYOT\/I8eBgBCJ7vuTJX169D2uVFd\/8YLM4Y+zLxI91xYFJURLfYDi6cX5+8Z9gfv3v0K34k8hA1+O4mlC4tJdLHK89SwBnUWkoHCeXGzj\/C\/BC\/dVXQf\/DG7RaxCBk8X9g+xnysyxYVg5UNRfLZDb4HQG+++HHkxikCRKZJEugBgIQUGQ8NwASY84vbXcCw7RwgtbC9hhgWlZj2wTdMJ3g2DZLfW\/8qy\/TuXffHsWxA58gkTF5EOTQQZDUYZCDoyDJofXtwEOd0INtLIGtL4NVvQVWY93Zrt10xGFznhp5\/NZmfhQZQ5sJBFTkDYASGMD2S\/irQrtuzwuWZeBigmnUnV+btrH9pql78suy4vDS\/6DfgLLOTdutaCdAkfiXvn1yEm+UCRIZRIZAPnwYu9MDIB85AqxpuxPwxUWw79wB65N\/gI3r7raN24gi6i2198r7LyvrZ3MNxxDxfQ9FoVsgwdISCqpbjt1bKkZLleoPcdUJAOOgBWLj8fDoU9AtkGBpUcJHthyr3HwtahSubeIfwLHVnug+6BZINLSo6tbx8moxH61XSz3l7yT+HPnVJ5+IB3\/9K+gWHAHTcvz4lmO1F16MGvOXHX7ntjItfq5cqWYLKyXoNYgDG58lTnefZZjn9MK1bPXuZeg1asihL1\/LEmczf61aylZKBeg1iKO2VmrDX871g79t\/DnGf+Fytn5xBnqN+vQMEBdx0rYjwOSJozkzUE0WVso9FSHVTRzERZzu\/gOn7+RUWUnW8gs9FSGJr3p3IbtWLieJs5W\/Ul7uqQip7kppuS2\/bRjIX+ipCLeLf+zq1ZytKsn69HRPRUjiq1+czhIXcdK+LQ8hihFKD4VDiW52xwS0\/fU7jxq\/3SA4HY\/qlpnGKZVEN7tjQuU\/vwe9cNW5+GM\/KnryB0ORRDe7QwJ2u47z7YQ\/PDSc8HradeE1BmzFjuJPT7o6xv\/M6UQ3u2NC7YXfoPMtrIuv6SFk08iW\/hj9wXK5eim\/VIRuodH4tFfjCbFkrkhOpBc+uITjNOgWSHz14tW018Vv5sfu8BIJpluguqrVUman\/N124kb8Mw+MPwqDBILjsz\/jOA26BRKfMb+QaRUfYdvXsd65dmMGp10m\/DihbdvOtMBqeW32u48ePddJ2btvHZxRY+MTfpyQW2uwdvsS6MUrs\/t\/cKtjfpz0nfDjhBzbX8JpmVp1dQ75J3ZaznXCUDiaiOzZ\/un\/QQ7YFP85jP8EdICVE9+ZVZ88c9aPE\/JyGeqv\/Bb0+fk5fOKdaHfOthPRJJgSCsePE4qKj0CCwS5z1o8Tri3+SUh8Lj8KZ9aPE4qIj+A6YbVSRCdcBlGIio9AgtHnF+b8OGH9lVc9xUfwzIRYNqRqdR1EQWUtFVIgCNuwUmblExCFWf4E6wj44jf0KojC0GvEPwUCIBHaHH6p++BvxH8KBGFza8q6fh1EYWJZqsPrHO9UnAJxzC+CKBjmrsCQxftwRYl3OgG9iZ8msWXDH7+sgCgwk+GLH5MAUSbtbvzZyAiIgg0NoYtJnvyeApQsnhhQO8sANGMAMyqSbWsgCEpDycGDIArKpNgMNBAE8VM2QhRU1g8\/ZksSlAkRhd\/40\/WXjhwBUVAmRVKY5nWOtwNKUlxRxO9ASuFhBOIgCkoNqsMgCgVTeKiiOIgC+WUfDkgpPD\/86IDHZB83QFfi78MBpSOHnTo8z3nAwWOUFxYFlZVAOgaCIH45NOpxBm8s7UFlJWC++P06oB9+bBsOgcRvAL\/xxxHEMfkr\/hwQ04ye\/Nu2Lk2DTwOwC956Cj3e0xsXuHAJk+SYR2btXtNaL8sS6es3cI7xKHQCnIoAwzITSnCrALlVgdr9d6C+lOY0zlOj4yy0\/wlonVWiLpje5lm8HMdsQw46gcsfULYKkKZX6I0XfEp1XhLA6RpoN3FMZYkfBNCYimk7BCB+zJo465\/dzjvvAnrFH0TBoW0XTNMr9MaL8cbrzjhPOX0GBp7ZOtHglGXe7fdywCiKi5aNHSQ8Sudgo3lxpTyjG\/ahWt08tFwszdK+UmVtc+VYFsfBNAiNQ+eIooVFSWAuSHiUqlv5OMWr+fkZq1Y6ZFbyh9buzM+ufDzF64Vr0OyIVBYXcX5sf\/NbKM6FxwnipfynUC4vzZq6PmbUamOl1aU52oeZjk0VMKf9UhRvgDh0iJppJlq7X5c\/f28JCrV9s8vyz8cw\/mMY\/zkS4nbxRwOIQ4egrAiKK+o8SLj8NK+HqbrKT34K+vTFWXOlOGbcujlWv3hxjvYZC5vTqFSW6vB6P3B7fzeDCbXJ\/cjxUHwYA57B7PVzLd+hnktfuZHK3y9OYq7xbGzvEIuEB50DQXobo1YnG85BB6ALoA6NNbY41O\/\/Dar5BW5b1Qzn8NyBx29lmvkXL1up8me\/m8R88tngvjNsIPYtCoHzNozEs0L8AwPBjW1yvDWck7O4TfypFv6JxcsjU0Xj7lSgvHwWU2lA7w4SAireBKzUMT89Abvjz2bHLUuPZO4Hnkp989TPMgB\/xaMvOfwY\/ymM\/1Qj\/uA3\/oDtl752eGNTf\/0NFN008NVyxsL2x66+n2k6ewJFNmU9\/8IUnnNWffppcN+alr9xHPg7723Lv60A3SdguquwUdw0rXbC20Ajue0I8d7SyjSW0UiIAUWBslUfgw7hPgGTq6GouKUvN4TX\/gPwRnLfEWL15mvTWEYjIUqBYdAtJsRP3R+5GnZ33LSMnfA7QixZ+RlMp2kkRBnbX6t1zs+Ba\/QETI5HwqtJD2eK6unUI6deygDMbzm\/EX9HiBj\/mUb8QTT+7hMwuVqdhHf7TkN47T9Ab7xc4AjRfv7FGRSiRkKkaRzO7W35PUe4NMbDH0\/htaIRiMfo2wQMxLO4rskKE0ps1pfomoPnhW9FQwiPLb4JGgrxWSyv4WBaiL9aWeFrYvxJ+jaktJKfFOVHziKN8xrtTz38fXKc9x9YrhH\/ZCP+9JGQcPwNdD2Dg6fwWtEQYpK+DUEhTuKdrOFcplhi+0oXvi3wU4fI2Kmbdfw\/8PuJfyffdojW8V+eSSW+hhteKQAAAABJRU5ErkJggg==) !important;\n  }\n  .signature-pad-passive, .signature-placeholder:after {\n    background-image: url(data:image\/svg+xml;base64,PHN2ZyB3aWR0aD0iMTk4IiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTk4IDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNNzQuMTA0NCA2LjM0NTA4SDc1LjU4NTlDNzUuNTQxMiA0LjcxNDQgNzQuMDk5NCAzLjUzMTE2IDcyLjAzMTIgMy41MzExNkM2OS45ODc5IDMuNTMxMTYgNjguNDIxOSA0LjY5OTQ4IDY4LjQyMTkgNi40NTQ0NkM2OC40MjE5IDcuODcxMzYgNjkuNDM2MSA4LjcwMTYyIDcxLjA3MTcgOS4xNDQwOUw3Mi4yNzQ5IDkuNDcyMjFDNzMuMzYzNiA5Ljc2MDU2IDc0LjIwMzggMTAuMTE4NSA3NC4yMDM4IDExLjAyMzNDNzQuMjAzOCAxMi4wMTc3IDczLjI1NDMgMTIuNjczOSA3MS45NDY3IDEyLjY3MzlDNzAuNzYzNSAxMi42NzM5IDY5Ljc3OTEgMTIuMTQ2OSA2OS42ODk2IDExLjAzODNINjguMTQ4NEM2OC4yNDc5IDEyLjg4MjcgNjkuNjc0NyAxNC4wMjEyIDcxLjk1NjcgMTQuMDIxMkM3NC4zNDggMTQuMDIxMiA3NS43MjUxIDEyLjc2MzQgNzUuNzI1MSAxMS4wMzgzQzc1LjcyNTEgOS4yMDM3NSA3NC4wODk1IDguNDkyODEgNzIuNzk2OSA4LjE3NDYzTDcxLjgwMjYgNy45MTYxQzcxLjAwNzEgNy43MTIyNyA2OS45NDgyIDcuMzM5NCA2OS45NTMxIDYuMzY0OTdDNjkuOTUzMSA1LjQ5OTkxIDcwLjc0MzYgNC44NTg1OCA3MS45OTY0IDQuODU4NThDNzMuMTY0OCA0Ljg1ODU4IDczLjk5NSA1LjQwNTQ1IDc0LjEwNDQgNi4zNDUwOFoiIGZpbGw9IiM4Nzk1QUIiLz4KPHBhdGggZD0iTTc3LjQ0MTYgMTMuODUyMkg3OC45MjgxVjYuMjE1ODJINzcuNDQxNlYxMy44NTIyWk03OC4xOTIzIDUuMDM3NTVDNzguNzA0NCA1LjAzNzU1IDc5LjEzMTkgNC42Mzk4MyA3OS4xMzE5IDQuMTUyNjFDNzkuMTMxOSAzLjY2NTM5IDc4LjcwNDQgMy4yNjI3IDc4LjE5MjMgMy4yNjI3Qzc3LjY3NTIgMy4yNjI3IDc3LjI1MjcgMy42NjUzOSA3Ny4yNTI3IDQuMTUyNjFDNzcuMjUyNyA0LjYzOTgzIDc3LjY3NTIgNS4wMzc1NSA3OC4xOTIzIDUuMDM3NTVaIiBmaWxsPSIjODc5NUFCIi8+CjxwYXRoIGQ9Ik04NC4xMjk2IDE2Ljg2Qzg2LjA3MzUgMTYuODYgODcuNTc0OSAxNS45NzAxIDg3LjU3NDkgMTQuMDIxMlY2LjIxNTgySDg2LjExODNWNy40NTM3NUg4Ni4wMDg5Qzg1Ljc0NTQgNi45ODE0NSA4NS4yMTg0IDYuMTE2MzkgODMuNzk2NSA2LjExNjM5QzgxLjk1MjEgNi4xMTYzOSA4MC41OTQ4IDcuNTczMDYgODAuNTk0OCAxMC4wMDQyQzgwLjU5NDggMTIuNDQwMyA4MS45ODE5IDEzLjczNzggODMuNzg2NiAxMy43Mzc4Qzg1LjE4ODYgMTMuNzM3OCA4NS43MzA1IDEyLjk0NzQgODUuOTk4OSAxMi40NjAxSDg2LjA5MzRWMTMuOTYxNkM4Ni4wOTM0IDE1LjEzOTggODUuMjczMSAxNS42NjE4IDg0LjE0NDUgMTUuNjYxOEM4Mi45MDY2IDE1LjY2MTggODIuNDI0NCAxNS4wNDA0IDgyLjE2MDkgMTQuNjE3OEw4MC44ODMyIDE1LjE0NDhDODEuMjg1OSAxNi4wNjQ1IDgyLjMwNSAxNi44NiA4NC4xMjk2IDE2Ljg2Wk04NC4xMTQ3IDEyLjUwNDlDODIuNzg3MyAxMi41MDQ5IDgyLjA5NjIgMTEuNDg1NyA4Mi4wOTYyIDkuOTg0MjlDODIuMDk2MiA4LjUxNzY3IDgyLjc3MjQgNy4zNzkxNyA4NC4xMTQ3IDcuMzc5MTdDODUuNDEyMyA3LjM3OTE3IDg2LjEwODMgOC40MzgxMiA4Ni4xMDgzIDkuOTg0MjlDODYuMTA4MyAxMS41NjAzIDg1LjM5NzQgMTIuNTA0OSA4NC4xMTQ3IDEyLjUwNDlaIiBmaWxsPSIjODc5NUFCIi8+CjxwYXRoIGQ9Ik05MS4wNTUgOS4zMTgwOUM5MS4wNTUgOC4xMDAwNSA5MS44MDA4IDcuNDA0MDMgOTIuODM0OSA3LjQwNDAzQzkzLjg0NDEgNy40MDQwMyA5NC40NTU2IDguMDY1MjUgOTQuNDU1NiA5LjE3MzkyVjEzLjg1MjJIOTUuOTQyMVY4Ljk5NDk0Qzk1Ljk0MjEgNy4xMDU3NCA5NC45MDMxIDYuMTE2MzkgOTMuMzQyIDYuMTE2MzlDOTIuMTkzNSA2LjExNjM5IDkxLjQ0MjggNi42NDgzNSA5MS4wODk4IDcuNDU4NzJIOTAuOTk1NFY2LjIxNTgySDg5LjU2ODVWMTMuODUyMkg5MS4wNTVWOS4zMTgwOVoiIGZpbGw9IiM4Nzk1QUIiLz4KPHBhdGggZD0iTTEwMS43NiAxMy44NTIySDEwMy4yOTZWOS40MTI1NUgxMDguMzcyVjEzLjg1MjJIMTA5LjkxNFYzLjY3MDM3SDEwOC4zNzJWOC4wOTUwOEgxMDMuMjk2VjMuNjcwMzdIMTAxLjc2VjEzLjg1MjJaIiBmaWxsPSIjODc5NUFCIi8+CjxwYXRoIGQ9Ik0xMTUuMzIzIDE0LjAwNjNDMTE2Ljk4OCAxNC4wMDYzIDExOC4xNjYgMTMuMTg2IDExOC41MDQgMTEuOTQzMUwxMTcuMDk3IDExLjY4OTVDMTE2LjgyOSAxMi40MTA0IDExNi4xODMgMTIuNzc4MyAxMTUuMzM4IDEyLjc3ODNDMTE0LjA2NSAxMi43NzgzIDExMy4yMSAxMS45NTMgMTEzLjE3IDEwLjQ4MTRIMTE4LjU5OVY5Ljk1NDQ2QzExOC41OTkgNy4xOTUyMiAxMTYuOTQ4IDYuMTE2MzkgMTE1LjIxOCA2LjExNjM5QzExMy4wOSA2LjExNjM5IDExMS42ODggNy43MzcxMyAxMTEuNjg4IDEwLjA4MzdDMTExLjY4OCAxMi40NTUyIDExMy4wNyAxNC4wMDYzIDExNS4zMjMgMTQuMDA2M1pNMTEzLjE3NSA5LjM2NzgxQzExMy4yMzUgOC4yODQgMTE0LjAyIDcuMzQ0MzcgMTE1LjIyOCA3LjM0NDM3QzExNi4zODIgNy4zNDQzNyAxMTcuMTM3IDguMTk5NDkgMTE3LjE0MiA5LjM2NzgxSDExMy4xNzVaIiBmaWxsPSIjODc5NUFCIi8+CjxwYXRoIGQ9Ik0xMjAuMjQ4IDEzLjg1MjJIMTIxLjczNVY5LjE4ODgzQzEyMS43MzUgOC4xODk1NCAxMjIuNTA1IDcuNDY4NjYgMTIzLjU1OSA3LjQ2ODY2QzEyMy44NjggNy40Njg2NiAxMjQuMjE2IDcuNTIzMzUgMTI0LjMzNSA3LjU1ODE1VjYuMTM2MjdDMTI0LjE4NiA2LjExNjM5IDEyMy44OTIgNi4xMDE0NyAxMjMuNzAzIDYuMTAxNDdDMTIyLjgwOSA2LjEwMTQ3IDEyMi4wNDMgNi42MDg1OCAxMjEuNzY1IDcuNDI4ODlIMTIxLjY4NVY2LjIxNTgySDEyMC4yNDhWMTMuODUyMloiIGZpbGw9IiM4Nzk1QUIiLz4KPHBhdGggZD0iTTEyOC42MzkgMTQuMDA2M0MxMzAuMzA1IDE0LjAwNjMgMTMxLjQ4MyAxMy4xODYgMTMxLjgyMSAxMS45NDMxTDEzMC40MTQgMTEuNjg5NUMxMzAuMTQ1IDEyLjQxMDQgMTI5LjQ5OSAxMi43NzgzIDEyOC42NTQgMTIuNzc4M0MxMjcuMzgxIDEyLjc3ODMgMTI2LjUyNiAxMS45NTMgMTI2LjQ4NiAxMC40ODE0SDEzMS45MTVWOS45NTQ0NkMxMzEuOTE1IDcuMTk1MjIgMTMwLjI2NSA2LjExNjM5IDEyOC41MzUgNi4xMTYzOUMxMjYuNDA3IDYuMTE2MzkgMTI1LjAwNSA3LjczNzEzIDEyNS4wMDUgMTAuMDgzN0MxMjUuMDA1IDEyLjQ1NTIgMTI2LjM4NyAxNC4wMDYzIDEyOC42MzkgMTQuMDA2M1pNMTI2LjQ5MSA5LjM2NzgxQzEyNi41NTEgOC4yODQgMTI3LjMzNiA3LjM0NDM3IDEyOC41NDUgNy4zNDQzN0MxMjkuNjk4IDcuMzQ0MzcgMTMwLjQ1NCA4LjE5OTQ5IDEzMC40NTkgOS4zNjc4MUgxMjYuNDkxWiIgZmlsbD0iIzg3OTVBQiIvPgo8cGF0aCBkPSJNMSAzNi4wMjI5QzEyLjI0NjEgMzkuMjIwNSAyMy4xODIgMzUuMDMyOCAzMi41MDg0IDI4Ljg1MTFDMzcuNDQwNCAyNS41ODIyIDQyLjMzNDEgMjEuNjY4NyA0NS4zMzI5IDE2LjUxMDFDNDYuNTI4MyAxNC40NTM5IDQ3Ljk4OTMgMTAuODg0NCA0NC4yMjcxIDEwLjg1MjhDNDAuMTMzNyAxMC44MTgzIDM3LjA4NjQgMTQuNTE0MiAzNS41NTg4IDE3Ljg3NDRDMzMuMzY4MSAyMi42OTMzIDMzLjI5MSAyOC40MDA0IDM1Ljk2NTYgMzMuMDQ0MUMzOC40OTcxIDM3LjQzOTYgNDIuNzQ0NSAzOS41MTg0IDQ3LjgxMTQgMzguNjYzOUM1My4xMDM3IDM3Ljc3MTMgNTcuNzMwNCAzNC4xNTYyIDYxLjU3NjUgMzAuNjc4NUM2Mi45OTMgMjkuMzk3NiA2NC4zMjA5IDI4LjA0NzUgNjUuNTQyIDI2LjU4NTdDNjUuNjg0MiAyNi40MTU1IDY2LjE4NDIgMjUuNTc5OCA2Ni41MDggMjUuNTIxOEM2Ni42Mjg0IDI1LjUwMDIgNjYuODA2NCAyOS4xNjQ1IDY2LjgzODUgMjkuMzY0M0M2Ny4xMjU1IDMxLjE1NDMgNjguMDI5NCAzMy4xNzA2IDcwLjE0MzEgMzMuMjMxOEM3Mi44MzMyIDMzLjMwOTcgNzUuMDgyNiAzMS4wNTkxIDc2Ljg5MjIgMjkuNDAxOEM3Ny41MDI2IDI4Ljg0MjggNzkuNDQyNSAyNi4xNjAxIDgwLjQ3NjQgMjYuMTYwMUM4MC45MDE0IDI2LjE2MDEgODEuNzI0OSAyOC4zMDM4IDgxLjkxMjcgMjguNTg4M0M4NC4zOTcyIDMyLjM1MjMgODguMDQ0NiAzMC45ODk0IDkwLjg3MzMgMjguMzUwNUM5MS4zOTM0IDI3Ljg2NTMgOTQuMTc4MSAyMy45ODM5IDk1LjMwOTEgMjQuNjgzMkM5Ni4yMjAzIDI1LjI0NjYgOTYuNjIxNyAyNi41NzY1IDk3LjA4ODYgMjcuNDYxOEM5Ny44NDg0IDI4LjkwMjkgOTguODEwNyAyOS45Mjk0IDEwMC40MTkgMzAuNDY1N0MxMDMuOTEyIDMxLjYzMSAxMDcuNjggMjguMzYzIDExMS4yMjIgMjguMzYzQzExMi4yNTUgMjguMzYzIDExMi43ODMgMjguOTMxNiAxMTMuMzMyIDI5LjcxNDhDMTE0LjA4MSAzMC43ODIzIDExNC44NTMgMzEuNTI3NiAxMTYuMjA1IDMxLjgxNzVDMTIwLjM5MyAzMi43MTU1IDEyMy44MjIgMjguNzM5OSAxMjcuODcyIDI5LjA4ODlDMTI5LjA1MyAyOS4xOTA3IDEyOS45MzUgMzAuMzgxNiAxMzAuODIxIDMxLjAxNjRDMTMyLjYwOSAzMi4yOTY5IDEzNC43NTkgMzMuMTgzNiAxMzYuOTQ4IDMzLjQ5NDdDMTQwLjQ1NyAzMy45OTM0IDE0My45NzUgMzMuMzMyNiAxNDcuMzk1IDMyLjU5MzVDMTUzLjMgMzEuMzE3NCAxNTkuMTQ3IDI5Ljc5NTggMTY1LjA2MiAyOC41NjMzIiBzdHJva2U9IiNERkUzRUQiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTE5Ni41MTUgMTUuMDc3OEwxODQuNDkyIDAuNTUxNzk1QzE4NC4yNTcgMC4yNjc4MSAxODMuODM4IDAuMjI4MjYgMTgzLjU1NCAwLjQ2MzMwN0wxODAuNjQ5IDIuODY3ODhDMTgwLjM2NSAzLjEwMjkzIDE4MC4zMjUgMy41MjI0IDE4MC41NiAzLjgwNjM4TDE5Mi41ODMgMTguMzMyNEMxOTIuNyAxOC40NzQxIDE5Mi44NjQgMTguNTU1MSAxOTMuMDM0IDE4LjU3MTJDMTkzLjIwNCAxOC41ODcyIDE5My4zOCAxOC41MzgyIDE5My41MjIgMTguNDIwOUwxOTYuNDI3IDE2LjAxNjRDMTk2LjcxMSAxNS43ODEzIDE5Ni43NSAxNS4zNjE4IDE5Ni41MTUgMTUuMDc3OFoiIGZpbGw9IiNERkUzRUQiLz4KPHBhdGggZD0iTTE4MS40MzYgNi45NTc2OUwxNzAuODU1IDkuODI2NDJDMTcwLjYyMiA5Ljg4OTUgMTcwLjQ0MSAxMC4wNzMzIDE3MC4zODMgMTAuMzA3NkwxNjYuMTU1IDI3LjEwMjFMMTczLjk3NSAyMC42Mjk2QzE3My4yNDUgMTkuMjYxNyAxNzMuNTUgMTcuNTE5NCAxNzQuNzkgMTYuNDkyNkMxNzYuMjA2IDE1LjMyMDMgMTc4LjMxMiAxNS41MTk2IDE3OS40ODMgMTYuOTM1MUMxODAuNjU1IDE4LjM1MTMgMTgwLjQ1NiAyMC40NTY2IDE3OS4wNDEgMjEuNjI4MkMxNzguMzMzIDIyLjIxNDQgMTc3LjQ1MiAyMi40NTgyIDE3Ni42MDMgMjIuMzc4MUMxNzUuOTY0IDIyLjMxNzkgMTc1LjM0MyAyMi4wNzQ1IDE3NC44MjUgMjEuNjU3M0wxNjcuMDA1IDI4LjEyOTFMMTg0LjI5NCAyNy4xMTQyQzE4NC41MzQgMjcuMTAwMSAxODQuNzQ5IDI2Ljk1NzYgMTg0Ljg1NCAyNi43NDA2TDE4OS42NSAxNi44ODE5TDE4MS40MzYgNi45NTc2OVoiIGZpbGw9IiNERkUzRUQiLz4KPC9zdmc+Cg==);\n  }\n  .form-spinner-button.form-spinner-up:before {\n    background-image: url(data:image\/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQiIGhlaWdodD0iMTQiIHZpZXdCb3g9IjAgMCAxNCAxNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik03LjUgMTIuNUw3LjUgNy41TDEyLjUgNy41QzEyLjc3NiA3LjUgMTMgNy4yNzYgMTMgN0MxMyA2LjcyNCAxMi43NzYgNi41IDEyLjUgNi41TDcuNSA2LjVMNy41IDEuNUM3LjUgMS4yMjQgNy4yNzYgMSA3IDFDNi43MjQgMSA2LjUgMS4yMjQgNi41IDEuNUw2LjUgNi41TDEuNSA2LjVDMS4yMjQgNi41IDAuOTk5OTk5IDYuNzI0IDAuOTk5OTk5IDdDMC45OTk5OTkgNy4yNzYgMS4yMjQgNy41IDEuNSA3LjVMNi41IDcuNUw2LjUgMTIuNUM2LjUgMTIuNzc2IDYuNzI0IDEzIDcgMTNDNy4yNzYgMTMgNy41IDEyLjc3NiA3LjUgMTIuNVoiIGZpbGw9IiM1NjY1N0UiIHN0cm9rZT0iIzU2NjU3RSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz4KPC9zdmc+Cg==);\n  }\n  .form-spinner-button.form-spinner-down:before {\n    background-image: url(data:image\/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQiIGhlaWdodD0iMyIgdmlld0JveD0iMCAwIDE0IDMiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xMi41IDJMNy41IDJMMS41IDJDMS4yMjQgMiAxIDEuNzc2IDEgMS41QzEgMS4yMjQgMS4yMjQgMC45OTk5OTkgMS41IDAuOTk5OTk5TDYuNSAxTDEyLjUgMUMxMi43NzYgMSAxMyAxLjIyNCAxMyAxLjVDMTMgMS43NzYgMTIuNzc2IDIgMTIuNSAyWiIgZmlsbD0iIzU2NjU3RSIgc3Ryb2tlPSIjNTY2NTdFIiBzdHJva2Utd2lkdGg9IjAuNSIvPgo8L3N2Zz4K);\n  }\n  .form-collapse-table:after{\n    background-image: url(data:image\/svg+xml;base64,PHN2ZyB3aWR0aD0iMTEiIGhlaWdodD0iMTEiIHZpZXdCb3g9IjAgMCAxMSAxMSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNS41IiBjeT0iNS41IiByPSI1LjUiIHRyYW5zZm9ybT0icm90YXRlKC05MCA1LjUgNS41KSIgZmlsbD0iI0MzQ0FEOCIgZmlsbC1vcGFjaXR5PSIwLjUiLz4KPHBhdGggZD0iTTMuMTY3NTYgNC40NjExMkMzLjE0NzkzIDQuNTAzMDggMy4xMzk2MSA0LjU1MDA4IDMuMTQzNTIgNC41OTY4M0MzLjE0NzQzIDQuNjQzNTggMy4xNjM0MyA0LjY4ODI0IDMuMTg5NzIgNC43MjU3OUw1LjMxMTE1IDcuNzU2NEM1LjMzMzEgNy43ODc3NyA1LjM2MTU3IDcuODEzMjMgNS4zOTQzIDcuODMwNzZDNS40MjcwMyA3Ljg0ODI5IDUuNDYzMTIgNy44NTc0MiA1LjQ5OTcyIDcuODU3NDJDNS41MzYzMSA3Ljg1NzQyIDUuNTcyNCA3Ljg0ODI5IDUuNjA1MTMgNy44MzA3NkM1LjYzNzg2IDcuODEzMjMgNS42NjYzMyA3Ljc4Nzc3IDUuNjg4MjkgNy43NTY0TDcuODA5NzIgNC43MjU3OUM3Ljg0MDMyIDQuNjgyMDcgNy44NTY4NiA0LjYyODkgNy44NTY4NiA0LjU3NDI2QzcuODU2NzIgNC41MzQ5OSA3Ljg0ODE4IDQuNDk2MjkgNy44MzE4OCA0LjQ2MTEyQzcuODEyMjggNC40MTkyMiA3Ljc4MjE5IDQuMzgzOTkgNy43NDQ5OCA0LjM1OTM3QzcuNzA3NzYgNC4zMzQ3NSA3LjY2NDg5IDQuMzIxNzEgNy42MjExNSA0LjMyMTcxTDMuMzc4MjkgNC4zMjE3MUMzLjMzNDU1IDQuMzIxNzEgMy4yOTE2NyA0LjMzNDc1IDMuMjU0NDYgNC4zNTkzN0MzLjIxNzI0IDQuMzgzOTkgMy4xODcxNSA0LjQxOTIyIDMuMTY3NTYgNC40NjExMlY0LjQ2MTEyWiIgZmlsbD0iI0U1RTdGMSIvPgo8L3N2Zz4K);\n  }\n  li[data-type=control_fileupload] .qq-upload-button:before {\n    background-image: url(data:image\/svg+xml;base64,PHN2ZyB3aWR0aD0iMzkiIGhlaWdodD0iMjciIHZpZXdCb3g9IjAgMCAzOSAyNyIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTMyLjM3NSAxMS4zMTI1QzMxLjUgNC44MTI1IDI2IDAgMTkuMzc1IDBDMTMuNjg3NSAwIDguNzUgMy41NjI1IDYuOTM3NSA4LjkzNzVDMi44NzUgOS44MTI1IDAgMTMuMzEyNSAwIDE3LjVDMCAyMi4wNjI1IDMuNTYyNSAyNS44NzUgOC4xMjUgMjYuMjVIMzEuODc1SDMxLjkzNzVDMzUuNzUgMjUuODc1IDM4Ljc1IDIyLjYyNSAzOC43NSAxOC43NUMzOC43NSAxNS4wNjI1IDM2IDExLjg3NSAzMi4zNzUgMTEuMzEyNVpNMjYuMDYyNSAxNC44MTI1QzI1LjkzNzUgMTQuOTM3NSAyNS44MTI1IDE1IDI1LjYyNSAxNUMyNS40Mzc1IDE1IDI1LjMxMjUgMTQuOTM3NSAyNS4xODc1IDE0LjgxMjVMMjAgOS42MjVWMjEuODc1QzIwIDIyLjI1IDE5Ljc1IDIyLjUgMTkuMzc1IDIyLjVDMTkgMjIuNSAxOC43NSAyMi4yNSAxOC43NSAyMS44NzVWOS42MjVMMTMuNTYyNSAxNC44MTI1QzEzLjMxMjUgMTUuMDYyNSAxMi45Mzc1IDE1LjA2MjUgMTIuNjg3NSAxNC44MTI1QzEyLjQzNzUgMTQuNTYyNSAxMi40Mzc1IDE0LjE4NzUgMTIuNjg3NSAxMy45Mzc1TDE4LjkzNzUgNy42ODc1QzE5IDcuNjI1IDE5LjA2MjUgNy41NjI1IDE5LjEyNSA3LjU2MjVDMTkuMjUgNy41IDE5LjQzNzUgNy41IDE5LjYyNSA3LjU2MjVDMTkuNjg3NSA3LjYyNSAxOS43NSA3LjYyNSAxOS44MTI1IDcuNjg3NUwyNi4wNjI1IDEzLjkzNzVDMjYuMzEyNSAxNC4xODc1IDI2LjMxMjUgMTQuNTYyNSAyNi4wNjI1IDE0LjgxMjVaIiBmaWxsPSIjQjNCQ0NDIi8+Cjwvc3ZnPgo=);\n  }\n  .appointmentDayPickerButton {\n    background-image: url(data:image\/svg+xml;base64,PHN2ZyB3aWR0aD0iOCIgaGVpZ2h0PSIxNCIgdmlld0JveD0iMCAwIDggMTQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDEzTDcgN0wxIDAuOTk5OTk5IiBzdHJva2U9IiM4Nzk1QUMiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=);\n  }\n\n  \/* NEW THEME STYLE *\/\n  \/*PREFERENCES STYLE*\/\/*PREFERENCES STYLE*\/\n    .form-all {\n      font-family: Inter, sans-serif;\n    }\n    .form-all .qq-upload-button,\n    .form-all .form-submit-button,\n    .form-all .form-submit-reset,\n    .form-all .form-submit-print {\n      font-family: Inter, sans-serif;\n    }\n    .form-all .form-pagebreak-back-container,\n    .form-all .form-pagebreak-next-container {\n      font-family: Inter, sans-serif;\n    }\n    .form-header-group {\n      font-family: Inter, sans-serif;\n    }\n    .form-label {\n      font-family: Inter, sans-serif;\n    }\n  \n    .form-label.form-label-auto {\n      \n    display: block;\n    float: none;\n    text-align: left;\n    width: 100%;\n  \n    }\n  \n    .form-line {\n      margin-top: 12px;\n      margin-bottom: 12px;\n    }\n  \n    .form-all {\n      max-width: 752px;\n      width: 100%;\n    }\n  \n    .form-label.form-label-left,\n    .form-label.form-label-right,\n    .form-label.form-label-left.form-label-auto,\n    .form-label.form-label-right.form-label-auto {\n      width: 230px;\n    }\n  \n    .form-all {\n      font-size: 16px\n    }\n    .form-all .qq-upload-button,\n    .form-all .qq-upload-button,\n    .form-all .form-submit-button,\n    .form-all .form-submit-reset,\n    .form-all .form-submit-print {\n      font-size: 16px\n    }\n    .form-all .form-pagebreak-back-container,\n    .form-all .form-pagebreak-next-container {\n      font-size: 16px\n    }\n  \n    .supernova .form-all, .form-all {\n      background-color: #f5f5f5;\n    }\n  \n    .form-all {\n      color: #2C3345;\n    }\n    .form-header-group .form-header {\n      color: #2C3345;\n    }\n    .form-header-group .form-subHeader {\n      color: #2C3345;\n    }\n    .form-label-top,\n    .form-label-left,\n    .form-label-right,\n    .form-html,\n    .form-checkbox-item label,\n    .form-radio-item label {\n      color: #2C3345;\n    }\n    .form-sub-label {\n      color: #464d5f;\n    }\n  \n    .supernova {\n      background-color: #ffffff;\n    }\n    .supernova body {\n      background: transparent;\n    }\n  \n    .form-textbox,\n    .form-textarea,\n    .form-dropdown,\n    .form-radio-other-input,\n    .form-checkbox-other-input,\n    .form-captcha input,\n    .form-spinner input {\n      background-color: #FFFFFF;\n    }\n  \n    .supernova {\n      background-image: none;\n    }\n    #stage {\n      background-image: none;\n    }\n  \n    .form-all {\n      background-image: none;\n    }\n  \n  .ie-8 .form-all:before { display: none; }\n  .ie-8 {\n    margin-top: auto;\n    margin-top: initial;\n  }\n  \n  \/*PREFERENCES STYLE*\/\/*__INSPECT_SEPERATOR__*\/.form-label.form-label-auto {\n        \n      display: block;\n      float: none;\n      text-align: left;\n      width: 100%;\n    \n      }\n    \/* Injected CSS Code *\/\n<\/style>\n\n<script src=\"https:\/\/cdn01.jotfor.ms\/static\/prototype.forms.js\" type=\"text\/javascript\"><\/script>\n<script src=\"https:\/\/cdn02.jotfor.ms\/static\/jotform.forms.js?3.3.33048\" type=\"text\/javascript\"><\/script>\n<script defer src=\"https:\/\/cdnjs.cloudflare.com\/ajax\/libs\/punycode\/1.4.1\/punycode.js\"><\/script>\n<script type=\"text\/javascript\">\tJotForm.newDefaultTheme = true;\n\tJotForm.extendsNewTheme = false;\n\tJotForm.newPaymentUIForNewCreatedForms = true;\n\tJotForm.newPaymentUI = true;\n\n var jsTime = setInterval(function(){try{\n   JotForm.jsForm = true;\n\tJotForm.clearFieldOnHide=\"disable\";\n\tJotForm.submitError=\"jumpToFirstError\";\n\n\tJotForm.init(function(){\n\t\/*INIT-START*\/\nif (window.JotForm && JotForm.accessible) $('input_5').setAttribute('tabindex',0);\n      JotForm.setCustomHint( 'input_5', 'Type here...' );\n      JotForm.alterTexts(undefined);\n\t\/*INIT-END*\/\n\t});\n\n   clearInterval(jsTime);\n }catch(e){}}, 1000);\n\n   JotForm.prepareCalculationsOnTheFly([null,{\"name\":\"heading\",\"qid\":\"1\",\"text\":\"Contact Us\",\"type\":\"control_head\"},{\"name\":\"submit2\",\"qid\":\"2\",\"text\":\"Submit\",\"type\":\"control_button\"},{\"description\":\"\",\"name\":\"name\",\"qid\":\"3\",\"text\":\"Name\",\"type\":\"control_fullname\"},{\"description\":\"\",\"name\":\"email\",\"qid\":\"4\",\"subLabel\":\"example@gmail.com\",\"text\":\"Email\",\"type\":\"control_email\"},{\"description\":\"\",\"name\":\"typeA\",\"qid\":\"5\",\"subLabel\":\"\",\"text\":\"Type a question\",\"type\":\"control_textarea\"}]);\n   setTimeout(function() {\nJotForm.paymentExtrasOnTheFly([null,{\"name\":\"heading\",\"qid\":\"1\",\"text\":\"Contact Us\",\"type\":\"control_head\"},{\"name\":\"submit2\",\"qid\":\"2\",\"text\":\"Submit\",\"type\":\"control_button\"},{\"description\":\"\",\"name\":\"name\",\"qid\":\"3\",\"text\":\"Name\",\"type\":\"control_fullname\"},{\"description\":\"\",\"name\":\"email\",\"qid\":\"4\",\"subLabel\":\"example@gmail.com\",\"text\":\"Email\",\"type\":\"control_email\"},{\"description\":\"\",\"name\":\"typeA\",\"qid\":\"5\",\"subLabel\":\"\",\"text\":\"Type a question\",\"type\":\"control_textarea\"}]);}, 20); \n<\/script>\n<\/head>\n<body>\n<form class=\"jotform-form\" action=\"https:\/\/submit.jotform.com\/submit\/221232877924056\/\" method=\"post\" name=\"form_221232877924056\" id=\"221232877924056\" accept-charset=\"utf-8\" autocomplete=\"on\">\n  <input type=\"hidden\" name=\"formID\" value=\"221232877924056\" \/>\n  <input type=\"hidden\" id=\"JWTContainer\" value=\"\" \/>\n  <input type=\"hidden\" id=\"cardinalOrderNumber\" value=\"\" \/>\n  <div role=\"main\" class=\"form-all\">\n    <style>\n      .form-all:before { background: none;}\n    <\/style>\n    <ul class=\"form-section page-section\">\n      <li id=\"cid_1\" class=\"form-input-wide\" data-type=\"control_head\">\n        <div class=\"form-header-group  header-large\">\n          <div class=\"header-text httal htvam\">\n            <h1 id=\"header_1\" class=\"form-header\" data-component=\"header\">\n              Contact Us\n            <\/h1>\n          <\/div>\n        <\/div>\n      <\/li>\n      <li class=\"form-line jf-required\" data-type=\"control_fullname\" id=\"id_3\">\n        <label class=\"form-label form-label-top form-label-auto\" id=\"label_3\" for=\"first_3\">\n          Name\n          <span class=\"form-required\">\n            *\n          <\/span>\n        <\/label>\n        <div id=\"cid_3\" class=\"form-input-wide jf-required\" data-layout=\"full\">\n          <div data-wrapper-react=\"true\">\n            <span class=\"form-sub-label-container\" style=\"vertical-align:top\" data-input-type=\"first\">\n              <input type=\"text\" id=\"first_3\" name=\"q3_name[first]\" class=\"form-textbox validate[required]\" data-defaultvalue=\"\" autoComplete=\"section-input_3 given-name\" size=\"10\" value=\"\" data-component=\"first\" aria-labelledby=\"label_3 sublabel_3_first\" required=\"\" \/>\n              <label class=\"form-sub-label\" for=\"first_3\" id=\"sublabel_3_first\" style=\"min-height:13px\" aria-hidden=\"false\"> First Name <\/label>\n            <\/span>\n            <span class=\"form-sub-label-container\" style=\"vertical-align:top\" data-input-type=\"last\">\n              <input type=\"text\" id=\"last_3\" name=\"q3_name[last]\" class=\"form-textbox validate[required]\" data-defaultvalue=\"\" autoComplete=\"section-input_3 family-name\" size=\"15\" value=\"\" data-component=\"last\" aria-labelledby=\"label_3 sublabel_3_last\" required=\"\" \/>\n              <label class=\"form-sub-label\" for=\"last_3\" id=\"sublabel_3_last\" style=\"min-height:13px\" aria-hidden=\"false\"> Last Name <\/label>\n            <\/span>\n          <\/div>\n        <\/div>\n      <\/li>\n      <li class=\"form-line fixed-width jf-required\" data-type=\"control_email\" id=\"id_4\">\n        <label class=\"form-label form-label-top form-label-auto\" id=\"label_4\" for=\"input_4\">\n          Email\n          <span class=\"form-required\">\n            *\n          <\/span>\n        <\/label>\n        <div id=\"cid_4\" class=\"form-input-wide jf-required\" data-layout=\"half\">\n          <span class=\"form-sub-label-container\" style=\"vertical-align:top\">\n            <input type=\"email\" id=\"input_4\" name=\"q4_email\" class=\"form-textbox validate[required, Email]\" data-defaultvalue=\"\" style=\"width:310px\" size=\"310\" value=\"\" data-component=\"email\" aria-labelledby=\"label_4 sublabel_input_4\" required=\"\" \/>\n            <label class=\"form-sub-label\" for=\"input_4\" id=\"sublabel_input_4\" style=\"min-height:13px\" aria-hidden=\"false\"> example@gmail.com <\/label>\n          <\/span>\n        <\/div>\n      <\/li>\n      <li class=\"form-line\" data-type=\"control_textarea\" id=\"id_5\">\n        <label class=\"form-label form-label-top form-label-auto\" id=\"label_5\" for=\"input_5\"> Type a question <\/label>\n        <div id=\"cid_5\" class=\"form-input-wide\" data-layout=\"full\">\n          <textarea id=\"input_5\" class=\"form-textarea\" name=\"q5_typeA\" style=\"width:648px;height:163px\" data-component=\"textarea\" aria-labelledby=\"label_5\"><\/textarea>\n        <\/div>\n      <\/li>\n      <li class=\"form-line\" data-type=\"control_button\" id=\"id_2\">\n        <div id=\"cid_2\" class=\"form-input-wide\" data-layout=\"full\">\n          <div data-align=\"auto\" class=\"form-buttons-wrapper form-buttons-auto   jsTest-button-wrapperField\">\n            <button id=\"input_2\" type=\"submit\" class=\"form-submit-button form-submit-button-simple_blue submit-button jf-form-buttons jsTest-submitField\" data-component=\"button\" data-content=\"\">\n              Submit\n            <\/button>\n          <\/div>\n        <\/div>\n      <\/li>\n      <li style=\"display:none\">\n        Should be Empty:\n        <input type=\"text\" name=\"website\" value=\"\" \/>\n      <\/li>\n    <\/ul>\n  <\/div>\n  <script>\n  JotForm.showJotFormPowered = \"new_footer\";\n  <\/script>\n  <script>\n  JotForm.poweredByText = \"Powered by Jotform\";\n  <\/script>\n  <input type=\"hidden\" class=\"simple_spc\" id=\"simple_spc\" name=\"simple_spc\" value=\"221232877924056\" \/>\n  <script type=\"text\/javascript\">\n  var all_spc = document.querySelectorAll(\"form[id='221232877924056'] .si\" + \"mple\" + \"_spc\");\nfor (var i = 0; i < all_spc.length; i++)\n{\n  all_spc[i].value = \"221232877924056-221232877924056\";\n}\n  <\/script>\n  <\/form><\/body>\n<\/html>\n<script src=\"https:\/\/cdn.jotfor.ms\/\/js\/vendor\/smoothscroll.min.js?v=3.3.33048\"><\/script>\n<script src=\"https:\/\/cdn.jotfor.ms\/\/js\/errorNavigation.js?v=3.3.33048\"><\/script>\n", "Contact Us", Array);
(function () {
    window.handleIFrameMessage = function (e) {
        if (!e.data || !e.data.split) return;
        var args = e.data.split(":");
        if (args[2] != "221232877924056") {
            return;
        }
        var iframe = document.getElementById("221232877924056");
        if (!iframe) {
            return
        };
        switch (args[0]) {
            case "scrollIntoView":
                if (!("nojump" in FrameBuilder.get)) {
                    iframe.scrollIntoView();
                }
                break;
            case "setHeight":
                var height = args[1] + "px";
                if (window.jfDeviceType === 'mobile' && typeof $jot !== 'undefined') {
                    var parent = $jot(iframe).closest('.jt-feedback.u-responsive-lightbox');
                    if (parent) {
                        height = '100%';
                    }
                }
                iframe.style.height = height
                break;
            case "setMinHeight":
                iframe.style.minHeight = args[1] + "px";
                break;
            case "collapseErrorPage":
                if (iframe.clientHeight > window.innerHeight) {
                    iframe.style.height = window.innerHeight + "px";
                }
                break;
            case "reloadPage":
                if (iframe) {
                    location.reload();
                }
                break;
            case "removeIframeOnloadAttr":
                iframe.removeAttribute("onload");
                break;
            case "loadScript":
                if (!window.isPermitted(e.origin, ['jotform.com', 'jotform.pro'])) {
                    break;
                }
                var src = args[1];
                if (args.length > 3) {
                    src = args[1] + ':' + args[2];
                }
                var script = document.createElement('script');
                script.src = src;
                script.type = 'text/javascript';
                document.body.appendChild(script);
                break;
            case "exitFullscreen":
                if (window.document.exitFullscreen) window.document.exitFullscreen();
                else if (window.document.mozCancelFullScreen) window.document.mozCancelFullScreen();
                else if (window.document.mozCancelFullscreen) window.document.mozCancelFullScreen();
                else if (window.document.webkitExitFullscreen) window.document.webkitExitFullscreen();
                else if (window.document.msExitFullscreen) window.document.msExitFullscreen();
                break;
            case 'setDeviceType':
                window.jfDeviceType = args[1];
                break;
        }
    };
    window.isPermitted = function (originUrl, whitelisted_domains) {
        var url = document.createElement('a');
        url.href = originUrl;
        var hostname = url.hostname;
        var result = false;
        if (typeof hostname !== 'undefined') {
            whitelisted_domains.forEach(function (element) {
                if (hostname.slice((-1 * element.length - 1)) === '.'.concat(element) || hostname === element) {
                    result = true;
                }
            });
            return result;
        }
    };
    if (window.addEventListener) {
        window.addEventListener("message", handleIFrameMessage, false);
    } else if (window.attachEvent) {
        window.attachEvent("onmessage", handleIFrameMessage);
    }
})();