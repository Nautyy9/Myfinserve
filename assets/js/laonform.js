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
var i221301129204034 = new FrameBuilder("221301129204034", false, "", 
"<!DOCTYPE HTML PUBLIC \"-\/\/W3C\/\/DTD HTML 4.01\/\/EN\" \"http:\/\/www.w3.org\/TR\/html4\/strict.dtd\">\n<html lang=\"en-US\"  class=\"supernova\"><head>\n<meta http-equiv=\"Content-Type\" content=\"text\/html; charset=utf-8\" \/>\n<link rel=\"alternate\" type=\"application\/json+oembed\" href=\"https:\/\/www.jotform.com\/oembed\/?format=json&amp;url=https%3A%2F%2Fform.jotform.com%2F221301129204034\" title=\"oEmbed Form\">\n<link rel=\"alternate\" type=\"text\/xml+oembed\" href=\"https:\/\/www.jotform.com\/oembed\/?format=xml&amp;url=https%3A%2F%2Fform.jotform.com%2F221301129204034\" title=\"oEmbed Form\">\n<meta property=\"og:title\" content=\"Loan Application Form\" >\n<meta property=\"og:url\" content=\"https:\/\/form.jotform.com\/221301129204034\" >\n<meta property=\"og:description\" content=\"Please click the link to complete this form.\" >\n<meta name=\"slack-app-id\" content=\"AHNMASS8M\">\n<link rel=\"shortcut icon\" href=\"https:\/\/cdn.jotfor.ms\/assets\/img\/favicons\/favicon-2021.svg\">\n<link rel=\"canonical\" href=\"https:\/\/form.jotform.com\/221301129204034\" \/>\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, maximum-scale=2.0, user-scalable=1\" \/>\n<meta name=\"HandheldFriendly\" content=\"true\" \/>\n<title>Loan Application Form<\/title>\n<style type=\"text\/css\">@media print{.form-section{display:inline!important}.form-pagebreak{display:none!important}.form-section-closed{height:auto!important}.page-section{position:initial!important}}<\/style>\n<link type=\"text\/css\" rel=\"stylesheet\" href=\"https:\/\/cdn01.jotfor.ms\/themes\/CSS\/5e6b428acc8c4e222d1beb91.css?themeRevisionID=5f7ed99c2c2c7240ba580251\"\/>\n<link type=\"text\/css\" rel=\"stylesheet\" href=\"https:\/\/cdn02.jotfor.ms\/css\/styles\/payment\/payment_styles.css?3.3.33122\" \/>\n<link type=\"text\/css\" rel=\"stylesheet\" href=\"https:\/\/cdn03.jotfor.ms\/css\/styles\/payment\/payment_feature.css?3.3.33122\" \/>\n<style type=\"text\/css\" id=\"form-designer-style\">\n    \/* Injected CSS Code *\/\n.form-label.form-label-auto {\n        \n      display: block;\n      float: none;\n      text-align: left;\n      width: 100%;\n    \n      }\n    \/* Injected CSS Code *\/\n<\/style>\n\n<script src=\"https:\/\/cdn01.jotfor.ms\/static\/prototype.forms.js\" type=\"text\/javascript\"><\/script>\n<script src=\"https:\/\/cdn02.jotfor.ms\/static\/jotform.forms.js?3.3.33122\" type=\"text\/javascript\"><\/script>\n<script defer src=\"https:\/\/cdnjs.cloudflare.com\/ajax\/libs\/punycode\/1.4.1\/punycode.js\"><\/script>\n<script src=\"https:\/\/cdn03.jotfor.ms\/js\/vendor\/jquery-1.8.0.min.js?v=3.3.33122\" type=\"text\/javascript\"><\/script>\n<script defer src=\"https:\/\/cdn01.jotfor.ms\/js\/vendor\/maskedinput.min.js?v=3.3.33122\" type=\"text\/javascript\"><\/script>\n<script defer src=\"https:\/\/cdn02.jotfor.ms\/js\/vendor\/jquery.maskedinput.min.js?v=3.3.33122\" type=\"text\/javascript\"><\/script>\n<script type=\"text\/javascript\">\tJotForm.newDefaultTheme = true;\n\tJotForm.extendsNewTheme = false;\n\tJotForm.newPaymentUIForNewCreatedForms = true;\n\tJotForm.newPaymentUI = true;\n\n var jsTime = setInterval(function(){try{\n   JotForm.jsForm = true;\n\tJotForm.clearFieldOnHide=\"disable\";\n\tJotForm.submitError=\"jumpToFirstError\";\n\n\tJotForm.init(function(){\n\t\/*INIT-START*\/\n      setTimeout(function() {\n          $('input_9').hint('Enter your email');\n       }, 20);\n\n JotForm.calendarMonths = [\"January\",\"February\",\"March\",\"April\",\"May\",\"June\",\"July\",\"August\",\"September\",\"October\",\"November\",\"December\"];\n JotForm.calendarDays = [\"Sunday\",\"Monday\",\"Tuesday\",\"Wednesday\",\"Thursday\",\"Friday\",\"Saturday\",\"Sunday\"];\n JotForm.calendarOther = {\"today\":\"Today\"};\n var languageOptions = document.querySelectorAll('#langList li'); \n for(var langIndex = 0; langIndex < languageOptions.length; langIndex++) { \n   languageOptions[langIndex].on('click', function(e) { setTimeout(function(){ JotForm.setCalendar(\"10\", false, {\"days\":{\"monday\":true,\"tuesday\":true,\"wednesday\":true,\"thursday\":true,\"friday\":true,\"saturday\":true,\"sunday\":true},\"future\":true,\"past\":true,\"custom\":false,\"ranges\":false,\"start\":\"\",\"end\":\"\"}); }, 0); });\n } \n JotForm.onTranslationsFetch(function() { JotForm.setCalendar(\"10\", false, {\"days\":{\"monday\":true,\"tuesday\":true,\"wednesday\":true,\"thursday\":true,\"friday\":true,\"saturday\":true,\"sunday\":true},\"future\":true,\"past\":true,\"custom\":false,\"ranges\":false,\"start\":\"\",\"end\":\"\"}); });\nif (window.JotForm && JotForm.accessible) $('input_13').setAttribute('tabindex',0);\n      setTimeout(function() {\n          $('input_13').hint('PAN Card No.');\n       }, 20);\n      JotForm.setInputTextMasking( 'input_13', '@@@@@####@' );\nif (window.JotForm && JotForm.accessible) $('input_14').setAttribute('tabindex',0);\n      setTimeout(function() {\n          $('input_14').hint('Aadhar card No.');\n       }, 20);\n      JotForm.setInputTextMasking( 'input_14', '####-####-####' );\nif (window.JotForm && JotForm.accessible) $('input_16').setAttribute('tabindex',0);\n      setTimeout(function() {\n          $('input_16').hint('Enter the amount you want in INR');\n       }, 20);\nif (window.JotForm && JotForm.accessible) $('input_17').setAttribute('tabindex',0);\n      setTimeout(function() {\n          $('input_17').hint('Enter the time period in years');\n       }, 20);\nif (window.JotForm && JotForm.accessible) $('input_19').setAttribute('tabindex',0);\n      JotForm.setCustomHint( 'input_19', 'Type here...' );\n      JotForm.alterTexts(undefined);\n\t\/*INIT-END*\/\n\t});\n\n   clearInterval(jsTime);\n }catch(e){}}, 1000);\n\n   JotForm.prepareCalculationsOnTheFly([null,{\"name\":\"heading\",\"qid\":\"1\",\"text\":\"Loan Application Form\",\"type\":\"control_head\"},{\"name\":\"submit2\",\"qid\":\"2\",\"text\":\"Submit\",\"type\":\"control_button\"},{\"description\":\"\",\"name\":\"chooseYour\",\"qid\":\"3\",\"subLabel\":\"\",\"text\":\"Choose Your Loan Type\",\"type\":\"control_dropdown\"},{\"description\":\"\",\"name\":\"phoneNumber\",\"qid\":\"4\",\"text\":\"Phone Number\",\"type\":\"control_phone\"},{\"description\":\"\",\"name\":\"enterYour\",\"qid\":\"5\",\"text\":\"Enter Your Full Name\",\"type\":\"control_fullname\"},null,null,null,{\"description\":\"\",\"name\":\"email\",\"qid\":\"9\",\"subLabel\":\"example@example.com\",\"text\":\"Email\",\"type\":\"control_email\"},{\"description\":\"\",\"name\":\"dateOf\",\"qid\":\"10\",\"text\":\"Date of Birth\",\"type\":\"control_datetime\"},null,null,{\"description\":\"\",\"name\":\"enterYour13\",\"qid\":\"13\",\"subLabel\":\"\",\"text\":\"Enter your PAN Card details\",\"type\":\"control_textbox\"},{\"description\":\"\",\"name\":\"enterYour14\",\"qid\":\"14\",\"subLabel\":\"\",\"text\":\"Enter your Aadhar details\",\"type\":\"control_textbox\"},null,{\"description\":\"\",\"name\":\"typeA\",\"qid\":\"16\",\"subLabel\":\"\",\"text\":\"Loan Amount \",\"type\":\"control_textbox\"},{\"description\":\"\",\"name\":\"loanTenure\",\"qid\":\"17\",\"subLabel\":\"\",\"text\":\"Loan Tenure\",\"type\":\"control_textbox\"},null,{\"description\":\"\",\"name\":\"reasonpurpose\",\"qid\":\"19\",\"subLabel\":\"\",\"text\":\"Reason\\u002FPurpose\",\"type\":\"control_textarea\"},{\"description\":\"\",\"name\":\"pleaseVerify\",\"qid\":\"20\",\"text\":\"Please verify that you are human\",\"type\":\"control_captcha\"},{\"description\":\"\",\"name\":\"address\",\"qid\":\"21\",\"text\":\"Address\",\"type\":\"control_address\"}]);\n   setTimeout(function() {\nJotForm.paymentExtrasOnTheFly([null,{\"name\":\"heading\",\"qid\":\"1\",\"text\":\"Loan Application Form\",\"type\":\"control_head\"},{\"name\":\"submit2\",\"qid\":\"2\",\"text\":\"Submit\",\"type\":\"control_button\"},{\"description\":\"\",\"name\":\"chooseYour\",\"qid\":\"3\",\"subLabel\":\"\",\"text\":\"Choose Your Loan Type\",\"type\":\"control_dropdown\"},{\"description\":\"\",\"name\":\"phoneNumber\",\"qid\":\"4\",\"text\":\"Phone Number\",\"type\":\"control_phone\"},{\"description\":\"\",\"name\":\"enterYour\",\"qid\":\"5\",\"text\":\"Enter Your Full Name\",\"type\":\"control_fullname\"},null,null,null,{\"description\":\"\",\"name\":\"email\",\"qid\":\"9\",\"subLabel\":\"example@example.com\",\"text\":\"Email\",\"type\":\"control_email\"},{\"description\":\"\",\"name\":\"dateOf\",\"qid\":\"10\",\"text\":\"Date of Birth\",\"type\":\"control_datetime\"},null,null,{\"description\":\"\",\"name\":\"enterYour13\",\"qid\":\"13\",\"subLabel\":\"\",\"text\":\"Enter your PAN Card details\",\"type\":\"control_textbox\"},{\"description\":\"\",\"name\":\"enterYour14\",\"qid\":\"14\",\"subLabel\":\"\",\"text\":\"Enter your Aadhar details\",\"type\":\"control_textbox\"},null,{\"description\":\"\",\"name\":\"typeA\",\"qid\":\"16\",\"subLabel\":\"\",\"text\":\"Loan Amount \",\"type\":\"control_textbox\"},{\"description\":\"\",\"name\":\"loanTenure\",\"qid\":\"17\",\"subLabel\":\"\",\"text\":\"Loan Tenure\",\"type\":\"control_textbox\"},null,{\"description\":\"\",\"name\":\"reasonpurpose\",\"qid\":\"19\",\"subLabel\":\"\",\"text\":\"Reason\\u002FPurpose\",\"type\":\"control_textarea\"},{\"description\":\"\",\"name\":\"pleaseVerify\",\"qid\":\"20\",\"text\":\"Please verify that you are human\",\"type\":\"control_captcha\"},{\"description\":\"\",\"name\":\"address\",\"qid\":\"21\",\"text\":\"Address\",\"type\":\"control_address\"}]);}, 20); \n<\/script>\n<\/head>\n<body>\n<form class=\"jotform-form\" action=\"https:\/\/submit.jotform.com\/submit\/221301129204034\/\" method=\"post\" name=\"form_221301129204034\" id=\"221301129204034\" accept-charset=\"utf-8\" autocomplete=\"on\">\n  <input type=\"hidden\" name=\"formID\" value=\"221301129204034\" \/>\n  <input type=\"hidden\" id=\"JWTContainer\" value=\"\" \/>\n  <input type=\"hidden\" id=\"cardinalOrderNumber\" value=\"\" \/>\n  <div role=\"main\" class=\"form-all\">\n    <style>\n      .form-all:before { background: none;}\n    <\/style>\n    <ul class=\"form-section page-section\">\n      <li id=\"cid_1\" class=\"form-input-wide\" data-type=\"control_head\">\n        <div class=\"form-header-group  header-large\">\n          <div class=\"header-text httal htvam\">\n            <h1 id=\"header_1\" class=\"form-header\" data-component=\"header\">\n              Loan Application Form\n            <\/h1>\n          <\/div>\n        <\/div>\n      <\/li>\n      <li class=\"form-line jf-required\" data-type=\"control_dropdown\" id=\"id_3\">\n        <label class=\"form-label form-label-left\" id=\"label_3\" for=\"input_3\">\n          Choose Your Loan Type\n          <span class=\"form-required\">\n            *\n          <\/span>\n        <\/label>\n        <div id=\"cid_3\" class=\"form-input jf-required\" data-layout=\"half\">\n          <select class=\"form-dropdown validate[required]\" id=\"input_3\" name=\"q3_chooseYour\" style=\"width:310px\" data-component=\"dropdown\" required=\"\">\n            <option value=\"\"> Please Select <\/option>\n            <option selected=\"\" value=\"Micro Finance\"> Micro Finance <\/option>\n            <option value=\"Business Loan\"> Business Loan <\/option>\n          <\/select>\n        <\/div>\n      <\/li>\n      <li class=\"form-line jf-required\" data-type=\"control_phone\" id=\"id_4\" data-compound-hint=\"+91,999XXXXXXX\">\n        <label class=\"form-label form-label-left\" id=\"label_4\" for=\"input_4_area\">\n          Phone Number\n          <span class=\"form-required\">\n            *\n          <\/span>\n        <\/label>\n        <div id=\"cid_4\" class=\"form-input jf-required\" data-layout=\"half\">\n          <div data-wrapper-react=\"true\">\n            <span class=\"form-sub-label-container\" style=\"vertical-align:top\" data-input-type=\"areaCode\">\n              <input type=\"tel\" id=\"input_4_area\" name=\"q4_phoneNumber[area]\" class=\"form-textbox validate[required]\" data-defaultvalue=\"\" autoComplete=\"section-input_4 tel-area-code\" value=\"\" placeholder=\"+91\" data-component=\"areaCode\" aria-labelledby=\"label_4 sublabel_4_area\" required=\"\" \/>\n              <span class=\"phone-separate\" aria-hidden=\"true\">\n                \u00a0-\n              <\/span>\n              <label class=\"form-sub-label\" for=\"input_4_area\" id=\"sublabel_4_area\" style=\"min-height:13px\" aria-hidden=\"false\"> Code <\/label>\n            <\/span>\n            <span class=\"form-sub-label-container\" style=\"vertical-align:top\" data-input-type=\"phone\">\n              <input type=\"tel\" id=\"input_4_phone\" name=\"q4_phoneNumber[phone]\" class=\"form-textbox validate[required]\" data-defaultvalue=\"\" autoComplete=\"section-input_4 tel-local\" value=\"\" placeholder=\"999XXXXXXX\" data-component=\"phone\" aria-labelledby=\"label_4 sublabel_4_phone\" required=\"\" \/>\n              <label class=\"form-sub-label\" for=\"input_4_phone\" id=\"sublabel_4_phone\" style=\"min-height:13px\" aria-hidden=\"false\"> Phone Number <\/label>\n            <\/span>\n          <\/div>\n        <\/div>\n      <\/li>\n      <li class=\"form-line jf-required\" data-type=\"control_fullname\" id=\"id_5\" data-compound-hint=\"Enter your first name,Enter your last name\">\n        <label class=\"form-label form-label-top\" id=\"label_5\" for=\"first_5\">\n          Enter Your Full Name\n          <span class=\"form-required\">\n            *\n          <\/span>\n        <\/label>\n        <div id=\"cid_5\" class=\"form-input-wide jf-required\" data-layout=\"full\">\n          <div data-wrapper-react=\"true\">\n            <span class=\"form-sub-label-container\" style=\"vertical-align:top\" data-input-type=\"first\">\n              <input type=\"text\" id=\"first_5\" name=\"q5_enterYour[first]\" class=\"form-textbox validate[required]\" data-defaultvalue=\"\" autoComplete=\"section-input_5 given-name\" size=\"10\" value=\"\" placeholder=\"Enter your first name\" data-component=\"first\" aria-labelledby=\"label_5\" required=\"\" \/>\n            <\/span>\n            <span class=\"form-sub-label-container\" style=\"vertical-align:top\" data-input-type=\"last\">\n              <input type=\"text\" id=\"last_5\" name=\"q5_enterYour[last]\" class=\"form-textbox validate[required]\" data-defaultvalue=\"\" autoComplete=\"section-input_5 family-name\" size=\"15\" value=\"\" placeholder=\"Enter your last name\" data-component=\"last\" aria-labelledby=\"label_5\" required=\"\" \/>\n            <\/span>\n          <\/div>\n        <\/div>\n      <\/li>\n      <li class=\"form-line jf-required\" data-type=\"control_email\" id=\"id_9\">\n        <label class=\"form-label form-label-left\" id=\"label_9\" for=\"input_9\">\n          Email\n          <span class=\"form-required\">\n            *\n          <\/span>\n        <\/label>\n        <div id=\"cid_9\" class=\"form-input jf-required\" data-layout=\"half\">\n          <span class=\"form-sub-label-container\" style=\"vertical-align:top\">\n            <input type=\"email\" id=\"input_9\" name=\"q9_email\" class=\"form-textbox validate[required, Email]\" data-defaultvalue=\"\" style=\"width:310px\" size=\"310\" value=\"\" placeholder=\"Enter your email\" data-component=\"email\" aria-labelledby=\"label_9 sublabel_input_9\" required=\"\" \/>\n            <label class=\"form-sub-label\" for=\"input_9\" id=\"sublabel_input_9\" style=\"min-height:13px\" aria-hidden=\"false\"> example@example.com <\/label>\n          <\/span>\n        <\/div>\n      <\/li>\n      <li class=\"form-line jf-required\" data-type=\"control_datetime\" id=\"id_10\">\n        <label class=\"form-label form-label-left\" id=\"label_10\" for=\"lite_mode_10\">\n          Date of Birth\n          <span class=\"form-required\">\n            *\n          <\/span>\n        <\/label>\n        <div id=\"cid_10\" class=\"form-input jf-required\" data-layout=\"half\">\n          <div data-wrapper-react=\"true\">\n            <div style=\"display:none\">\n              <span class=\"form-sub-label-container\" style=\"vertical-align:top\">\n                <input type=\"tel\" class=\"form-textbox validate[required, limitDate]\" id=\"month_10\" name=\"q10_dateOf[month]\" size=\"2\" data-maxlength=\"2\" data-age=\"18\" maxLength=\"2\" value=\"\" required=\"\" autoComplete=\"section-input_10 off\" aria-labelledby=\"label_10 sublabel_10_month\" \/>\n                <span class=\"date-separate\" aria-hidden=\"true\">\n                  \u00a0-\n                <\/span>\n                <label class=\"form-sub-label\" for=\"month_10\" id=\"sublabel_10_month\" style=\"min-height:13px\" aria-hidden=\"false\"> Month <\/label>\n              <\/span>\n              <span class=\"form-sub-label-container\" style=\"vertical-align:top\">\n                <input type=\"tel\" class=\"form-textbox validate[required, limitDate]\" id=\"day_10\" name=\"q10_dateOf[day]\" size=\"2\" data-maxlength=\"2\" data-age=\"18\" maxLength=\"2\" value=\"\" required=\"\" autoComplete=\"section-input_10 off\" aria-labelledby=\"label_10 sublabel_10_day\" \/>\n                <span class=\"date-separate\" aria-hidden=\"true\">\n                  \u00a0-\n                <\/span>\n                <label class=\"form-sub-label\" for=\"day_10\" id=\"sublabel_10_day\" style=\"min-height:13px\" aria-hidden=\"false\"> Day <\/label>\n              <\/span>\n              <span class=\"form-sub-label-container\" style=\"vertical-align:top\">\n                <input type=\"tel\" class=\"form-textbox validate[required, limitDate]\" id=\"year_10\" name=\"q10_dateOf[year]\" size=\"4\" data-maxlength=\"4\" data-age=\"18\" maxLength=\"4\" value=\"\" required=\"\" autoComplete=\"section-input_10 off\" aria-labelledby=\"label_10 sublabel_10_year\" \/>\n                <label class=\"form-sub-label\" for=\"year_10\" id=\"sublabel_10_year\" style=\"min-height:13px\" aria-hidden=\"false\"> Year <\/label>\n              <\/span>\n            <\/div>\n            <span class=\"form-sub-label-container\" style=\"vertical-align:top\">\n              <input type=\"text\" class=\"form-textbox validate[required, limitDate, validateLiteDate]\" id=\"lite_mode_10\" size=\"12\" data-maxlength=\"12\" maxLength=\"12\" data-age=\"18\" value=\"\" required=\"\" data-format=\"mmddyyyy\" data-seperator=\"-\" placeholder=\"MM-DD-YYYY\" autoComplete=\"section-input_10 off\" aria-labelledby=\"label_10\" \/>\n              <img class=\"showAutoCalendar newDefaultTheme-dateIcon icon-liteMode\" alt=\"Pick a Date\" id=\"input_10_pick\" src=\"https:\/\/cdn.jotfor.ms\/images\/calendar.png\" data-component=\"datetime\" aria-hidden=\"true\" data-allow-time=\"No\" data-version=\"v2\" \/>\n              <label class=\"form-sub-label is-empty\" for=\"lite_mode_10\" id=\"sublabel_10_litemode\" style=\"min-height:13px\" aria-hidden=\"false\">  <\/label>\n            <\/span>\n          <\/div>\n        <\/div>\n      <\/li>\n      <li class=\"form-line jf-required\" data-type=\"control_address\" id=\"id_21\">\n        <label class=\"form-label form-label-top\" id=\"label_21\" for=\"input_21_addr_line1\">\n          Address\n          <span class=\"form-required\">\n            *\n          <\/span>\n        <\/label>\n        <div id=\"cid_21\" class=\"form-input-wide jf-required\" data-layout=\"full\">\n          <div summary=\"\" class=\"form-address-table jsTest-addressField\">\n            <div class=\"form-address-line-wrapper jsTest-address-line-wrapperField\">\n              <span class=\"form-address-line form-address-street-line jsTest-address-lineField\">\n                <span class=\"form-sub-label-container\" style=\"vertical-align:top\">\n                  <input type=\"text\" id=\"input_21_addr_line1\" name=\"q21_address[addr_line1]\" class=\"form-textbox validate[required] form-address-line\" data-defaultvalue=\"\" autoComplete=\"section-input_21 address-line1\" value=\"\" data-component=\"address_line_1\" aria-labelledby=\"label_21 sublabel_21_addr_line1\" required=\"\" \/>\n                  <label class=\"form-sub-label\" for=\"input_21_addr_line1\" id=\"sublabel_21_addr_line1\" style=\"min-height:13px\" aria-hidden=\"false\"> Street Address <\/label>\n                <\/span>\n              <\/span>\n            <\/div>\n            <div class=\"form-address-line-wrapper jsTest-address-line-wrapperField\">\n              <span class=\"form-address-line form-address-street-line jsTest-address-lineField\">\n                <span class=\"form-sub-label-container\" style=\"vertical-align:top\">\n                  <input type=\"text\" id=\"input_21_addr_line2\" name=\"q21_address[addr_line2]\" class=\"form-textbox form-address-line\" data-defaultvalue=\"\" autoComplete=\"section-input_21 address-line2\" value=\"\" data-component=\"address_line_2\" aria-labelledby=\"label_21 sublabel_21_addr_line2\" \/>\n                  <label class=\"form-sub-label\" for=\"input_21_addr_line2\" id=\"sublabel_21_addr_line2\" style=\"min-height:13px\" aria-hidden=\"false\"> Street Address Line 2 <\/label>\n                <\/span>\n              <\/span>\n            <\/div>\n            <div class=\"form-address-line-wrapper jsTest-address-line-wrapperField\">\n              <span class=\"form-address-line form-address-city-line jsTest-address-lineField \">\n                <span class=\"form-sub-label-container\" style=\"vertical-align:top\">\n                  <input type=\"text\" id=\"input_21_city\" name=\"q21_address[city]\" class=\"form-textbox validate[required] form-address-city\" data-defaultvalue=\"\" autoComplete=\"section-input_21 address-level2\" value=\"\" data-component=\"city\" aria-labelledby=\"label_21 sublabel_21_city\" required=\"\" \/>\n                  <label class=\"form-sub-label\" for=\"input_21_city\" id=\"sublabel_21_city\" style=\"min-height:13px\" aria-hidden=\"false\"> City <\/label>\n                <\/span>\n              <\/span>\n              <span class=\"form-address-line form-address-state-line jsTest-address-lineField \">\n                <span class=\"form-sub-label-container\" style=\"vertical-align:top\">\n                  <input type=\"text\" id=\"input_21_state\" name=\"q21_address[state]\" class=\"form-textbox validate[required] form-address-state\" data-defaultvalue=\"\" autoComplete=\"section-input_21 address-level1\" value=\"\" data-component=\"state\" aria-labelledby=\"label_21 sublabel_21_state\" required=\"\" \/>\n                  <label class=\"form-sub-label\" for=\"input_21_state\" id=\"sublabel_21_state\" style=\"min-height:13px\" aria-hidden=\"false\"> State <\/label>\n                <\/span>\n              <\/span>\n            <\/div>\n            <div class=\"form-address-line-wrapper jsTest-address-line-wrapperField\">\n              <span class=\"form-address-line form-address-zip-line jsTest-address-lineField \">\n                <span class=\"form-sub-label-container\" style=\"vertical-align:top\">\n                  <input type=\"text\" id=\"input_21_postal\" name=\"q21_address[postal]\" class=\"form-textbox validate[required] form-address-postal\" data-defaultvalue=\"\" autoComplete=\"section-input_21 postal-code\" value=\"\" data-component=\"zip\" aria-labelledby=\"label_21 sublabel_21_postal\" required=\"\" \/>\n                  <label class=\"form-sub-label\" for=\"input_21_postal\" id=\"sublabel_21_postal\" style=\"min-height:13px\" aria-hidden=\"false\"> Zip Code <\/label>\n                <\/span>\n              <\/span>\n              <span class=\"form-address-line form-address-country-line jsTest-address-lineField \">\n                <span class=\"form-sub-label-container\" style=\"vertical-align:top\">\n                  <select class=\"form-dropdown validate[required] form-address-country noTranslate\" name=\"q21_address[country]\" id=\"input_21_country\" data-component=\"country\" required=\"\" aria-labelledby=\"label_21 sublabel_21_country\" autoComplete=\"section-input_21 country\">\n                    <option value=\"\"> Please Select <\/option>\n                    <option value=\"United States\"> United States <\/option>\n                    <option value=\"Afghanistan\"> Afghanistan <\/option>\n                    <option value=\"Albania\"> Albania <\/option>\n                    <option value=\"Algeria\"> Algeria <\/option>\n                    <option value=\"American Samoa\"> American Samoa <\/option>\n                    <option value=\"Andorra\"> Andorra <\/option>\n                    <option value=\"Angola\"> Angola <\/option>\n                    <option value=\"Anguilla\"> Anguilla <\/option>\n                    <option value=\"Antigua and Barbuda\"> Antigua and Barbuda <\/option>\n                    <option value=\"Argentina\"> Argentina <\/option>\n                    <option value=\"Armenia\"> Armenia <\/option>\n                    <option value=\"Aruba\"> Aruba <\/option>\n                    <option value=\"Australia\"> Australia <\/option>\n                    <option value=\"Austria\"> Austria <\/option>\n                    <option value=\"Azerbaijan\"> Azerbaijan <\/option>\n                    <option value=\"The Bahamas\"> The Bahamas <\/option>\n                    <option value=\"Bahrain\"> Bahrain <\/option>\n                    <option value=\"Bangladesh\"> Bangladesh <\/option>\n                    <option value=\"Barbados\"> Barbados <\/option>\n                    <option value=\"Belarus\"> Belarus <\/option>\n                    <option value=\"Belgium\"> Belgium <\/option>\n                    <option value=\"Belize\"> Belize <\/option>\n                    <option value=\"Benin\"> Benin <\/option>\n                    <option value=\"Bermuda\"> Bermuda <\/option>\n                    <option value=\"Bhutan\"> Bhutan <\/option>\n                    <option value=\"Bolivia\"> Bolivia <\/option>\n                    <option value=\"Bosnia and Herzegovina\"> Bosnia and Herzegovina <\/option>\n                    <option value=\"Botswana\"> Botswana <\/option>\n                    <option value=\"Brazil\"> Brazil <\/option>\n                    <option value=\"Brunei\"> Brunei <\/option>\n                    <option value=\"Bulgaria\"> Bulgaria <\/option>\n                    <option value=\"Burkina Faso\"> Burkina Faso <\/option>\n                    <option value=\"Burundi\"> Burundi <\/option>\n                    <option value=\"Cambodia\"> Cambodia <\/option>\n                    <option value=\"Cameroon\"> Cameroon <\/option>\n                    <option value=\"Canada\"> Canada <\/option>\n                    <option value=\"Cape Verde\"> Cape Verde <\/option>\n                    <option value=\"Cayman Islands\"> Cayman Islands <\/option>\n                    <option value=\"Central African Republic\"> Central African Republic <\/option>\n                    <option value=\"Chad\"> Chad <\/option>\n                    <option value=\"Chile\"> Chile <\/option>\n                    <option value=\"China\"> China <\/option>\n                    <option value=\"Christmas Island\"> Christmas Island <\/option>\n                    <option value=\"Cocos (Keeling) Islands\"> Cocos (Keeling) Islands <\/option>\n                    <option value=\"Colombia\"> Colombia <\/option>\n                    <option value=\"Comoros\"> Comoros <\/option>\n                    <option value=\"Congo\"> Congo <\/option>\n                    <option value=\"Cook Islands\"> Cook Islands <\/option>\n                    <option value=\"Costa Rica\"> Costa Rica <\/option>\n                    <option value=\"Cote d&#x27;Ivoire\"> Cote d&#x27;Ivoire <\/option>\n                    <option value=\"Croatia\"> Croatia <\/option>\n                    <option value=\"Cuba\"> Cuba <\/option>\n                    <option value=\"Curacao\"> Curacao <\/option>\n                    <option value=\"Cyprus\"> Cyprus <\/option>\n                    <option value=\"Czech Republic\"> Czech Republic <\/option>\n                    <option value=\"Democratic Republic of the Congo\"> Democratic Republic of the Congo <\/option>\n                    <option value=\"Denmark\"> Denmark <\/option>\n                    <option value=\"Djibouti\"> Djibouti <\/option>\n                    <option value=\"Dominica\"> Dominica <\/option>\n                    <option value=\"Dominican Republic\"> Dominican Republic <\/option>\n                    <option value=\"Ecuador\"> Ecuador <\/option>\n                    <option value=\"Egypt\"> Egypt <\/option>\n                    <option value=\"El Salvador\"> El Salvador <\/option>\n                    <option value=\"Equatorial Guinea\"> Equatorial Guinea <\/option>\n                    <option value=\"Eritrea\"> Eritrea <\/option>\n                    <option value=\"Estonia\"> Estonia <\/option>\n                    <option value=\"Ethiopia\"> Ethiopia <\/option>\n                    <option value=\"Falkland Islands\"> Falkland Islands <\/option>\n                    <option value=\"Faroe Islands\"> Faroe Islands <\/option>\n                    <option value=\"Fiji\"> Fiji <\/option>\n                    <option value=\"Finland\"> Finland <\/option>\n                    <option value=\"France\"> France <\/option>\n                    <option value=\"French Polynesia\"> French Polynesia <\/option>\n                    <option value=\"Gabon\"> Gabon <\/option>\n                    <option value=\"The Gambia\"> The Gambia <\/option>\n                    <option value=\"Georgia\"> Georgia <\/option>\n                    <option value=\"Germany\"> Germany <\/option>\n                    <option value=\"Ghana\"> Ghana <\/option>\n                    <option value=\"Gibraltar\"> Gibraltar <\/option>\n                    <option value=\"Greece\"> Greece <\/option>\n                    <option value=\"Greenland\"> Greenland <\/option>\n                    <option value=\"Grenada\"> Grenada <\/option>\n                    <option value=\"Guadeloupe\"> Guadeloupe <\/option>\n                    <option value=\"Guam\"> Guam <\/option>\n                    <option value=\"Guatemala\"> Guatemala <\/option>\n                    <option value=\"Guernsey\"> Guernsey <\/option>\n                    <option value=\"Guinea\"> Guinea <\/option>\n                    <option value=\"Guinea-Bissau\"> Guinea-Bissau <\/option>\n                    <option value=\"Guyana\"> Guyana <\/option>\n                    <option value=\"Haiti\"> Haiti <\/option>\n                    <option value=\"Honduras\"> Honduras <\/option>\n                    <option value=\"Hong Kong\"> Hong Kong <\/option>\n                    <option value=\"Hungary\"> Hungary <\/option>\n                    <option value=\"Iceland\"> Iceland <\/option>\n                    <option selected=\"\" value=\"India\"> India <\/option>\n                    <option value=\"Indonesia\"> Indonesia <\/option>\n                    <option value=\"Iran\"> Iran <\/option>\n                    <option value=\"Iraq\"> Iraq <\/option>\n                    <option value=\"Ireland\"> Ireland <\/option>\n                    <option value=\"Israel\"> Israel <\/option>\n                    <option value=\"Italy\"> Italy <\/option>\n                    <option value=\"Jamaica\"> Jamaica <\/option>\n                    <option value=\"Japan\"> Japan <\/option>\n                    <option value=\"Jersey\"> Jersey <\/option>\n                    <option value=\"Jordan\"> Jordan <\/option>\n                    <option value=\"Kazakhstan\"> Kazakhstan <\/option>\n                    <option value=\"Kenya\"> Kenya <\/option>\n                    <option value=\"Kiribati\"> Kiribati <\/option>\n                    <option value=\"North Korea\"> North Korea <\/option>\n                    <option value=\"South Korea\"> South Korea <\/option>\n                    <option value=\"Kosovo\"> Kosovo <\/option>\n                    <option value=\"Kuwait\"> Kuwait <\/option>\n                    <option value=\"Kyrgyzstan\"> Kyrgyzstan <\/option>\n                    <option value=\"Laos\"> Laos <\/option>\n                    <option value=\"Latvia\"> Latvia <\/option>\n                    <option value=\"Lebanon\"> Lebanon <\/option>\n                    <option value=\"Lesotho\"> Lesotho <\/option>\n                    <option value=\"Liberia\"> Liberia <\/option>\n                    <option value=\"Libya\"> Libya <\/option>\n                    <option value=\"Liechtenstein\"> Liechtenstein <\/option>\n                    <option value=\"Lithuania\"> Lithuania <\/option>\n                    <option value=\"Luxembourg\"> Luxembourg <\/option>\n                    <option value=\"Macau\"> Macau <\/option>\n                    <option value=\"Macedonia\"> Macedonia <\/option>\n                    <option value=\"Madagascar\"> Madagascar <\/option>\n                    <option value=\"Malawi\"> Malawi <\/option>\n                    <option value=\"Malaysia\"> Malaysia <\/option>\n                    <option value=\"Maldives\"> Maldives <\/option>\n                    <option value=\"Mali\"> Mali <\/option>\n                    <option value=\"Malta\"> Malta <\/option>\n                    <option value=\"Marshall Islands\"> Marshall Islands <\/option>\n                    <option value=\"Martinique\"> Martinique <\/option>\n                    <option value=\"Mauritania\"> Mauritania <\/option>\n                    <option value=\"Mauritius\"> Mauritius <\/option>\n                    <option value=\"Mayotte\"> Mayotte <\/option>\n                    <option value=\"Mexico\"> Mexico <\/option>\n                    <option value=\"Micronesia\"> Micronesia <\/option>\n                    <option value=\"Moldova\"> Moldova <\/option>\n                    <option value=\"Monaco\"> Monaco <\/option>\n                    <option value=\"Mongolia\"> Mongolia <\/option>\n                    <option value=\"Montenegro\"> Montenegro <\/option>\n                    <option value=\"Montserrat\"> Montserrat <\/option>\n                    <option value=\"Morocco\"> Morocco <\/option>\n                    <option value=\"Mozambique\"> Mozambique <\/option>\n                    <option value=\"Myanmar\"> Myanmar <\/option>\n                    <option value=\"Nagorno-Karabakh\"> Nagorno-Karabakh <\/option>\n                    <option value=\"Namibia\"> Namibia <\/option>\n                    <option value=\"Nauru\"> Nauru <\/option>\n                    <option value=\"Nepal\"> Nepal <\/option>\n                    <option value=\"Netherlands\"> Netherlands <\/option>\n                    <option value=\"Netherlands Antilles\"> Netherlands Antilles <\/option>\n                    <option value=\"New Caledonia\"> New Caledonia <\/option>\n                    <option value=\"New Zealand\"> New Zealand <\/option>\n                    <option value=\"Nicaragua\"> Nicaragua <\/option>\n                    <option value=\"Niger\"> Niger <\/option>\n                    <option value=\"Nigeria\"> Nigeria <\/option>\n                    <option value=\"Niue\"> Niue <\/option>\n                    <option value=\"Norfolk Island\"> Norfolk Island <\/option>\n                    <option value=\"Turkish Republic of Northern Cyprus\"> Turkish Republic of Northern Cyprus <\/option>\n                    <option value=\"Northern Mariana\"> Northern Mariana <\/option>\n                    <option value=\"Norway\"> Norway <\/option>\n                    <option value=\"Oman\"> Oman <\/option>\n                    <option value=\"Pakistan\"> Pakistan <\/option>\n                    <option value=\"Palau\"> Palau <\/option>\n                    <option value=\"Palestine\"> Palestine <\/option>\n                    <option value=\"Panama\"> Panama <\/option>\n                    <option value=\"Papua New Guinea\"> Papua New Guinea <\/option>\n                    <option value=\"Paraguay\"> Paraguay <\/option>\n                    <option value=\"Peru\"> Peru <\/option>\n                    <option value=\"Philippines\"> Philippines <\/option>\n                    <option value=\"Pitcairn Islands\"> Pitcairn Islands <\/option>\n                    <option value=\"Poland\"> Poland <\/option>\n                    <option value=\"Portugal\"> Portugal <\/option>\n                    <option value=\"Puerto Rico\"> Puerto Rico <\/option>\n                    <option value=\"Qatar\"> Qatar <\/option>\n                    <option value=\"Republic of the Congo\"> Republic of the Congo <\/option>\n                    <option value=\"Romania\"> Romania <\/option>\n                    <option value=\"Russia\"> Russia <\/option>\n                    <option value=\"Rwanda\"> Rwanda <\/option>\n                    <option value=\"Saint Barthelemy\"> Saint Barthelemy <\/option>\n                    <option value=\"Saint Helena\"> Saint Helena <\/option>\n                    <option value=\"Saint Kitts and Nevis\"> Saint Kitts and Nevis <\/option>\n                    <option value=\"Saint Lucia\"> Saint Lucia <\/option>\n                    <option value=\"Saint Martin\"> Saint Martin <\/option>\n                    <option value=\"Saint Pierre and Miquelon\"> Saint Pierre and Miquelon <\/option>\n                    <option value=\"Saint Vincent and the Grenadines\"> Saint Vincent and the Grenadines <\/option>\n                    <option value=\"Samoa\"> Samoa <\/option>\n                    <option value=\"San Marino\"> San Marino <\/option>\n                    <option value=\"Sao Tome and Principe\"> Sao Tome and Principe <\/option>\n                    <option value=\"Saudi Arabia\"> Saudi Arabia <\/option>\n                    <option value=\"Senegal\"> Senegal <\/option>\n                    <option value=\"Serbia\"> Serbia <\/option>\n                    <option value=\"Seychelles\"> Seychelles <\/option>\n                    <option value=\"Sierra Leone\"> Sierra Leone <\/option>\n                    <option value=\"Singapore\"> Singapore <\/option>\n                    <option value=\"Slovakia\"> Slovakia <\/option>\n                    <option value=\"Slovenia\"> Slovenia <\/option>\n                    <option value=\"Solomon Islands\"> Solomon Islands <\/option>\n                    <option value=\"Somalia\"> Somalia <\/option>\n                    <option value=\"Somaliland\"> Somaliland <\/option>\n                    <option value=\"South Africa\"> South Africa <\/option>\n                    <option value=\"South Ossetia\"> South Ossetia <\/option>\n                    <option value=\"South Sudan\"> South Sudan <\/option>\n                    <option value=\"Spain\"> Spain <\/option>\n                    <option value=\"Sri Lanka\"> Sri Lanka <\/option>\n                    <option value=\"Sudan\"> Sudan <\/option>\n                    <option value=\"Suriname\"> Suriname <\/option>\n                    <option value=\"Svalbard\"> Svalbard <\/option>\n                    <option value=\"eSwatini\"> eSwatini <\/option>\n                    <option value=\"Sweden\"> Sweden <\/option>\n                    <option value=\"Switzerland\"> Switzerland <\/option>\n                    <option value=\"Syria\"> Syria <\/option>\n                    <option value=\"Taiwan\"> Taiwan <\/option>\n                    <option value=\"Tajikistan\"> Tajikistan <\/option>\n                    <option value=\"Tanzania\"> Tanzania <\/option>\n                    <option value=\"Thailand\"> Thailand <\/option>\n                    <option value=\"Timor-Leste\"> Timor-Leste <\/option>\n                    <option value=\"Togo\"> Togo <\/option>\n                    <option value=\"Tokelau\"> Tokelau <\/option>\n                    <option value=\"Tonga\"> Tonga <\/option>\n                    <option value=\"Transnistria Pridnestrovie\"> Transnistria Pridnestrovie <\/option>\n                    <option value=\"Trinidad and Tobago\"> Trinidad and Tobago <\/option>\n                    <option value=\"Tristan da Cunha\"> Tristan da Cunha <\/option>\n                    <option value=\"Tunisia\"> Tunisia <\/option>\n                    <option value=\"Turkey\"> Turkey <\/option>\n                    <option value=\"Turkmenistan\"> Turkmenistan <\/option>\n                    <option value=\"Turks and Caicos Islands\"> Turks and Caicos Islands <\/option>\n                    <option value=\"Tuvalu\"> Tuvalu <\/option>\n                    <option value=\"Uganda\"> Uganda <\/option>\n                    <option value=\"Ukraine\"> Ukraine <\/option>\n                    <option value=\"United Arab Emirates\"> United Arab Emirates <\/option>\n                    <option value=\"United Kingdom\"> United Kingdom <\/option>\n                    <option value=\"Uruguay\"> Uruguay <\/option>\n                    <option value=\"Uzbekistan\"> Uzbekistan <\/option>\n                    <option value=\"Vanuatu\"> Vanuatu <\/option>\n                    <option value=\"Vatican City\"> Vatican City <\/option>\n                    <option value=\"Venezuela\"> Venezuela <\/option>\n                    <option value=\"Vietnam\"> Vietnam <\/option>\n                    <option value=\"British Virgin Islands\"> British Virgin Islands <\/option>\n                    <option value=\"Isle of Man\"> Isle of Man <\/option>\n                    <option value=\"US Virgin Islands\"> US Virgin Islands <\/option>\n                    <option value=\"Wallis and Futuna\"> Wallis and Futuna <\/option>\n                    <option value=\"Western Sahara\"> Western Sahara <\/option>\n                    <option value=\"Yemen\"> Yemen <\/option>\n                    <option value=\"Zambia\"> Zambia <\/option>\n                    <option value=\"Zimbabwe\"> Zimbabwe <\/option>\n                    <option value=\"other\"> Other <\/option>\n                  <\/select>\n                  <label class=\"form-sub-label\" for=\"input_21_country\" id=\"sublabel_21_country\" style=\"min-height:13px\" aria-hidden=\"false\"> Country <\/label>\n                <\/span>\n              <\/span>\n            <\/div>\n          <\/div>\n        <\/div>\n      <\/li>\n      <li class=\"form-line fixed-width jf-required\" data-type=\"control_textbox\" id=\"id_13\">\n        <label class=\"form-label form-label-top\" id=\"label_13\" for=\"input_13\">\n          Enter your PAN Card details\n          <span class=\"form-required\">\n            *\n          <\/span>\n        <\/label>\n        <div id=\"cid_13\" class=\"form-input-wide jf-required\" data-layout=\"half\">\n          <input type=\"text\" id=\"input_13\" name=\"q13_enterYour13\" data-type=\"input-textbox\" class=\"form-textbox validate[required, Fill Mask]\" data-defaultvalue=\"\" style=\"width:310px\" size=\"310\" data-masked=\"true\" value=\"\" placeholder=\"PAN Card No.\" data-component=\"textbox\" aria-labelledby=\"label_13\" required=\"\" \/>\n        <\/div>\n      <\/li>\n      <li class=\"form-line fixed-width jf-required\" data-type=\"control_textbox\" id=\"id_14\">\n        <label class=\"form-label form-label-top\" id=\"label_14\" for=\"input_14\">\n          Enter your Aadhar details\n          <span class=\"form-required\">\n            *\n          <\/span>\n        <\/label>\n        <div id=\"cid_14\" class=\"form-input-wide jf-required\" data-layout=\"half\">\n          <input type=\"text\" id=\"input_14\" name=\"q14_enterYour14\" data-type=\"input-textbox\" class=\"form-textbox validate[required, Fill Mask]\" data-defaultvalue=\"\" style=\"width:310px\" size=\"310\" data-masked=\"true\" value=\"\" placeholder=\"Aadhar card No.\" data-component=\"textbox\" aria-labelledby=\"label_14\" required=\"\" \/>\n        <\/div>\n      <\/li>\n      <li class=\"form-line fixed-width jf-required\" data-type=\"control_textbox\" id=\"id_16\">\n        <label class=\"form-label form-label-top\" id=\"label_16\" for=\"input_16\">\n          Loan Amount\n          <span class=\"form-required\">\n            *\n          <\/span>\n        <\/label>\n        <div id=\"cid_16\" class=\"form-input-wide jf-required\" data-layout=\"half\">\n          <input type=\"text\" id=\"input_16\" name=\"q16_typeA\" data-type=\"input-textbox\" class=\"form-textbox validate[required, Numeric]\" data-defaultvalue=\"\" style=\"width:310px\" size=\"310\" value=\"\" placeholder=\"Enter the amount you want in INR\" data-component=\"textbox\" aria-labelledby=\"label_16\" required=\"\" \/>\n        <\/div>\n      <\/li>\n      <li class=\"form-line fixed-width jf-required\" data-type=\"control_textbox\" id=\"id_17\">\n        <label class=\"form-label form-label-top\" id=\"label_17\" for=\"input_17\">\n          Loan Tenure\n          <span class=\"form-required\">\n            *\n          <\/span>\n        <\/label>\n        <div id=\"cid_17\" class=\"form-input-wide jf-required\" data-layout=\"half\">\n          <input type=\"text\" id=\"input_17\" name=\"q17_loanTenure\" data-type=\"input-textbox\" class=\"form-textbox validate[required]\" data-defaultvalue=\"\" style=\"width:310px\" size=\"310\" value=\"\" placeholder=\"Enter the time period in years\" data-component=\"textbox\" aria-labelledby=\"label_17\" required=\"\" \/>\n        <\/div>\n      <\/li>\n      <li class=\"form-line jf-required\" data-type=\"control_textarea\" id=\"id_19\">\n        <label class=\"form-label form-label-top\" id=\"label_19\" for=\"input_19\">\n          Reason\/Purpose\n          <span class=\"form-required\">\n            *\n          <\/span>\n        <\/label>\n        <div id=\"cid_19\" class=\"form-input-wide jf-required\" data-layout=\"full\">\n          <div class=\"form-textarea-limit\">\n            <span>\n              <textarea id=\"input_19\" class=\"form-textarea validate[required]\" name=\"q19_reasonpurpose\" style=\"width:648px;height:163px\" data-component=\"textarea\" required=\"\"><\/textarea>\n              <div class=\"form-textarea-limit-indicator\">\n                <span data-limit=\"250\" type=\"Words\" data-minimum=\"-1\" data-typeminimum=\"None\" id=\"input_19-limit\">\n                  0\/250\n                <\/span>\n              <\/div>\n            <\/span>\n          <\/div>\n        <\/div>\n      <\/li>\n      <li class=\"form-line jf-required\" data-type=\"control_captcha\" id=\"id_20\">\n        <label class=\"form-label form-label-left\" id=\"label_20\" for=\"input_20\">\n          Please verify that you are human\n          <span class=\"form-required\">\n            *\n          <\/span>\n        <\/label>\n        <div id=\"cid_20\" class=\"form-input jf-required\" data-layout=\"full\">\n          <section data-wrapper-react=\"true\">\n            <div id=\"recaptcha_input_20\" data-component=\"recaptcha\" data-callback=\"recaptchaCallbackinput_20\" data-expired-callback=\"recaptchaExpiredCallbackinput_20\">\n            <\/div>\n            <input type=\"hidden\" id=\"input_20\" class=\"hidden validate[required]\" name=\"recaptcha_visible\" required=\"\" \/>\n            <script type=\"text\/javascript\" src=\"https:\/\/www.google.com\/recaptcha\/api.js?render=explicit&amp;onload=recaptchaLoadedinput_20\"><\/script>\n            <script type=\"text\/javascript\">\n                    var recaptchaLoadedinput_20 = function()\n          {\n            window.grecaptcha.render($(\"recaptcha_input_20\"), {\n              sitekey: '6LdU3CgUAAAAAB0nnFM3M3T0sy707slYYU51RroJ',\n            });\n            var grecaptchaBadge = document.querySelector('.grecaptcha-badge');\n            if (grecaptchaBadge)\n            {\n              grecaptchaBadge.style.boxShadow = 'gray 0px 0px 2px';\n            }\n          };\n\n        \/**\n         * Called when the reCaptcha verifies the user is human\n         * For invisible reCaptcha;\n         *   Submit event is stopped after validations and recaptcha is executed.\n         *   If a challenge is not displayed, this will be called right after grecaptcha.execute()\n         *   If a challenge is displayed, this will be called when the challenge is solved successfully\n         *   Submit is triggered to actually submit the form since it is stopped before.\n         *\/\n        var recaptchaCallbackinput_20 = function()\n          {\n            var isInvisibleReCaptcha = false;\n            var hiddenInput = $(\"input_20\");\n            hiddenInput.setValue(1);\n            if (!isInvisibleReCaptcha)\n            {\n              if (hiddenInput.validateInput)\n              {\n                hiddenInput.validateInput();\n              }\n            }\n            else\n            {\n              triggerSubmit(hiddenInput.form)\n            }\n\n            function triggerSubmit(formElement)\n            {\n              var button = formElement.ownerDocument.createElement('input');\n              button.style.display = 'none';\n              button.type = 'submit';\n              formElement.appendChild(button).click();\n              formElement.removeChild(button);\n            }\n          }\n\n          \/\/ not really required for invisible recaptcha\n        var recaptchaExpiredCallbackinput_20 = function()\n          {\n            var hiddenInput = $(\"input_20\");\n            hiddenInput.writeAttribute(\"value\", false);\n            if (hiddenInput.validateInput)\n            {\n              hiddenInput.validateInput();\n            }\n          }\n            <\/script>\n          <\/section>\n        <\/div>\n      <\/li>\n      <li class=\"form-line\" data-type=\"control_button\" id=\"id_2\">\n        <div id=\"cid_2\" class=\"form-input-wide\" data-layout=\"full\">\n          <div data-align=\"center\" class=\"form-buttons-wrapper form-buttons-center   jsTest-button-wrapperField\">\n            <button id=\"input_2\" type=\"submit\" class=\"form-submit-button form-submit-button-simple_blue submit-button jf-form-buttons jsTest-submitField\" data-component=\"button\" data-content=\"\">\n              Submit\n            <\/button>\n          <\/div>\n          <div class=\"form-submit-clear-wrapper\">\n            <button id=\"input_reset_2\" type=\"reset\" class=\"form-submit-reset form-submit-button-simple_blue jf-form-buttons\" data-component=\"button\">\n              Clear All Questions\n            <\/button>\n          <\/div>\n        <\/div>\n      <\/li>\n      <li style=\"display:none\">\n        Should be Empty:\n        <input type=\"text\" name=\"website\" value=\"\" \/>\n      <\/li>\n    <\/ul>\n  <\/div>\n    <div class=\"formFooter-heightMask\">\n  <\/div>\n<\/form><\/body>\n<\/html>\n<script src=\"https:\/\/cdn.jotfor.ms\/\/js\/vendor\/smoothscroll.min.js?v=3.3.33122\"><\/script>\n<script src=\"https:\/\/cdn.jotfor.ms\/\/js\/errorNavigation.js?v=3.3.33122\"><\/script>\n", "Loan Application Form", Array);
(function () {
    window.handleIFrameMessage = function (e) {
        if (!e.data || !e.data.split) return;
        var args = e.data.split(":");
        if (args[2] != "221301129204034") {
            return;
        }
        var iframe = document.getElementById("221301129204034");
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