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
var i221233199546054 = new FrameBuilder("221233199546054", false, "", "<!DOCTYPE HTML PUBLIC \"-\/\/W3C\/\/DTD HTML 4.01\/\/EN\" \"http:\/\/www.w3.org\/TR\/html4\/strict.dtd\">\n<html lang=\"en-US\"  class=\"supernova\"><head>\n<meta http-equiv=\"Content-Type\" content=\"text\/html; charset=utf-8\" \/>\n<link rel=\"alternate\" type=\"application\/json+oembed\" href=\"https:\/\/www.jotform.com\/oembed\/?format=json&amp;url=https%3A%2F%2Fform.jotform.com%2F221233199546054\" title=\"oEmbed Form\">\n<link rel=\"alternate\" type=\"text\/xml+oembed\" href=\"https:\/\/www.jotform.com\/oembed\/?format=xml&amp;url=https%3A%2F%2Fform.jotform.com%2F221233199546054\" title=\"oEmbed Form\">\n<meta property=\"og:title\" content=\"F\" >\n<meta property=\"og:url\" content=\"https:\/\/form.jotform.com\/221233199546054\" >\n<meta property=\"og:description\" content=\"Please click the link to complete this form.\" >\n<meta name=\"slack-app-id\" content=\"AHNMASS8M\">\n<link rel=\"shortcut icon\" href=\"https:\/\/cdn.jotfor.ms\/assets\/img\/favicons\/favicon-2021.svg\">\n<link rel=\"canonical\" href=\"https:\/\/form.jotform.com\/221233199546054\" \/>\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, maximum-scale=2.0, user-scalable=1\" \/>\n<meta name=\"HandheldFriendly\" content=\"true\" \/>\n<title>F<\/title>\n<style type=\"text\/css\">@media print{.form-section{display:inline!important}.form-pagebreak{display:none!important}.form-section-closed{height:auto!important}.page-section{position:initial!important}}<\/style>\n<link type=\"text\/css\" rel=\"stylesheet\" href=\"https:\/\/cdn01.jotfor.ms\/themes\/CSS\/5e6b428acc8c4e222d1beb91.css?themeRevisionID=5f7ed99c2c2c7240ba580251\"\/>\n<link type=\"text\/css\" rel=\"stylesheet\" href=\"https:\/\/cdn02.jotfor.ms\/css\/styles\/payment\/payment_styles.css?3.3.33049\" \/>\n<link type=\"text\/css\" rel=\"stylesheet\" href=\"https:\/\/cdn03.jotfor.ms\/css\/styles\/payment\/payment_feature.css?3.3.33049\" \/>\n<script src=\"https:\/\/cdn01.jotfor.ms\/static\/prototype.forms.js\" type=\"text\/javascript\"><\/script>\n<script src=\"https:\/\/cdn02.jotfor.ms\/static\/jotform.forms.js?3.3.33049\" type=\"text\/javascript\"><\/script>\n<script defer src=\"https:\/\/cdnjs.cloudflare.com\/ajax\/libs\/punycode\/1.4.1\/punycode.js\"><\/script>\n<script src=\"https:\/\/cdn03.jotfor.ms\/js\/vendor\/imageinfo.js?v=3.3.33049\" type=\"text\/javascript\"><\/script>\n<script src=\"https:\/\/cdn01.jotfor.ms\/file-uploader\/fileuploader.js?v=3.3.33049\"><\/script>\n<script type=\"text\/javascript\">\tJotForm.newDefaultTheme = true;\n\tJotForm.extendsNewTheme = false;\n\tJotForm.newPaymentUIForNewCreatedForms = true;\n\tJotForm.newPaymentUI = true;\n\n var jsTime = setInterval(function(){try{\n   JotForm.jsForm = true;\n\tJotForm.clearFieldOnHide=\"disable\";\n\tJotForm.submitError=\"jumpToFirstError\";\n\n\tJotForm.init(function(){\n\t\/*INIT-START*\/\n      JotForm.alterTexts(undefined);\n      setTimeout(function() {\n          JotForm.initMultipleUploads();\n      }, 2);\n\t\/*INIT-END*\/\n\t});\n\n   clearInterval(jsTime);\n }catch(e){}}, 1000);\n\n   JotForm.prepareCalculationsOnTheFly([null,null,{\"name\":\"submit2\",\"qid\":\"2\",\"text\":\"Submit\",\"type\":\"control_button\"},{\"description\":\"\",\"name\":\"name\",\"qid\":\"3\",\"text\":\"Name\",\"type\":\"control_fullname\"},{\"description\":\"\",\"name\":\"email\",\"qid\":\"4\",\"subLabel\":\"example@gmail.com\",\"text\":\"Email\",\"type\":\"control_email\"},{\"description\":\"\",\"name\":\"phoneNumber\",\"qid\":\"5\",\"text\":\"Phone Number\",\"type\":\"control_phone\"},{\"description\":\"\",\"name\":\"file\",\"qid\":\"6\",\"subLabel\":\"We accept pdf, doc, docx\",\"text\":\"Attach Your Resume\",\"type\":\"control_fileupload\"}]);\n   setTimeout(function() {\nJotForm.paymentExtrasOnTheFly([null,null,{\"name\":\"submit2\",\"qid\":\"2\",\"text\":\"Submit\",\"type\":\"control_button\"},{\"description\":\"\",\"name\":\"name\",\"qid\":\"3\",\"text\":\"Name\",\"type\":\"control_fullname\"},{\"description\":\"\",\"name\":\"email\",\"qid\":\"4\",\"subLabel\":\"example@gmail.com\",\"text\":\"Email\",\"type\":\"control_email\"},{\"description\":\"\",\"name\":\"phoneNumber\",\"qid\":\"5\",\"text\":\"Phone Number\",\"type\":\"control_phone\"},{\"description\":\"\",\"name\":\"file\",\"qid\":\"6\",\"subLabel\":\"We accept pdf, doc, docx\",\"text\":\"Attach Your Resume\",\"type\":\"control_fileupload\"}]);}, 20); \n<\/script>\n<\/head>\n<body>\n<form class=\"jotform-form\" action=\"https:\/\/submit.jotform.com\/submit\/221233199546054\/\" method=\"post\" enctype=\"multipart\/form-data\" name=\"form_221233199546054\" id=\"221233199546054\" accept-charset=\"utf-8\" autocomplete=\"on\">\n  <input type=\"hidden\" name=\"formID\" value=\"221233199546054\" \/>\n  <input type=\"hidden\" id=\"JWTContainer\" value=\"\" \/>\n  <input type=\"hidden\" id=\"cardinalOrderNumber\" value=\"\" \/>\n  <div role=\"main\" class=\"form-all\">\n    <style>\n      .form-all:before { background: none;}\n    <\/style>\n    <ul class=\"form-section page-section\">\n      <li class=\"form-line jf-required\" data-type=\"control_fullname\" id=\"id_3\">\n        <label class=\"form-label form-label-top form-label-auto\" id=\"label_3\" for=\"first_3\">\n          Name\n          <span class=\"form-required\">\n            *\n          <\/span>\n        <\/label>\n        <div id=\"cid_3\" class=\"form-input-wide jf-required\" data-layout=\"full\">\n          <div data-wrapper-react=\"true\">\n            <span class=\"form-sub-label-container\" style=\"vertical-align:top\" data-input-type=\"first\">\n              <input type=\"text\" id=\"first_3\" name=\"q3_name[first]\" class=\"form-textbox validate[required]\" data-defaultvalue=\"\" autoComplete=\"section-input_3 given-name\" size=\"10\" value=\"\" data-component=\"first\" aria-labelledby=\"label_3 sublabel_3_first\" required=\"\" \/>\n              <label class=\"form-sub-label\" for=\"first_3\" id=\"sublabel_3_first\" style=\"min-height:13px\" aria-hidden=\"false\"> First Name <\/label>\n            <\/span>\n            <span class=\"form-sub-label-container\" style=\"vertical-align:top\" data-input-type=\"last\">\n              <input type=\"text\" id=\"last_3\" name=\"q3_name[last]\" class=\"form-textbox validate[required]\" data-defaultvalue=\"\" autoComplete=\"section-input_3 family-name\" size=\"15\" value=\"\" data-component=\"last\" aria-labelledby=\"label_3 sublabel_3_last\" required=\"\" \/>\n              <label class=\"form-sub-label\" for=\"last_3\" id=\"sublabel_3_last\" style=\"min-height:13px\" aria-hidden=\"false\"> Last Name <\/label>\n            <\/span>\n          <\/div>\n        <\/div>\n      <\/li>\n      <li class=\"form-line fixed-width jf-required\" data-type=\"control_email\" id=\"id_4\">\n        <label class=\"form-label form-label-top form-label-auto\" id=\"label_4\" for=\"input_4\">\n          Email\n          <span class=\"form-required\">\n            *\n          <\/span>\n        <\/label>\n        <div id=\"cid_4\" class=\"form-input-wide jf-required\" data-layout=\"half\">\n          <span class=\"form-sub-label-container\" style=\"vertical-align:top\">\n            <input type=\"email\" id=\"input_4\" name=\"q4_email\" class=\"form-textbox validate[required, Email]\" data-defaultvalue=\"\" style=\"width:310px\" size=\"310\" value=\"\" data-component=\"email\" aria-labelledby=\"label_4 sublabel_input_4\" required=\"\" \/>\n            <label class=\"form-sub-label\" for=\"input_4\" id=\"sublabel_input_4\" style=\"min-height:13px\" aria-hidden=\"false\"> example@gmail.com <\/label>\n          <\/span>\n        <\/div>\n      <\/li>\n      <li class=\"form-line jf-required\" data-type=\"control_phone\" id=\"id_5\">\n        <label class=\"form-label form-label-top form-label-auto\" id=\"label_5\" for=\"input_5_area\">\n          Phone Number\n          <span class=\"form-required\">\n            *\n          <\/span>\n        <\/label>\n        <div id=\"cid_5\" class=\"form-input-wide jf-required\" data-layout=\"half\">\n          <div data-wrapper-react=\"true\">\n            <span class=\"form-sub-label-container\" style=\"vertical-align:top\" data-input-type=\"areaCode\">\n              <input type=\"tel\" id=\"input_5_area\" name=\"q5_phoneNumber[area]\" class=\"form-textbox validate[required]\" data-defaultvalue=\"\" autoComplete=\"section-input_5 tel-area-code\" value=\"\" data-component=\"areaCode\" aria-labelledby=\"label_5 sublabel_5_area\" required=\"\" \/>\n              <span class=\"phone-separate\" aria-hidden=\"true\">\n                \u00a0-\n              <\/span>\n              <label class=\"form-sub-label\" for=\"input_5_area\" id=\"sublabel_5_area\" style=\"min-height:13px\" aria-hidden=\"false\"> Area Code <\/label>\n            <\/span>\n            <span class=\"form-sub-label-container\" style=\"vertical-align:top\" data-input-type=\"phone\">\n              <input type=\"tel\" id=\"input_5_phone\" name=\"q5_phoneNumber[phone]\" class=\"form-textbox validate[required]\" data-defaultvalue=\"\" autoComplete=\"section-input_5 tel-local\" value=\"\" data-component=\"phone\" aria-labelledby=\"label_5 sublabel_5_phone\" required=\"\" \/>\n              <label class=\"form-sub-label\" for=\"input_5_phone\" id=\"sublabel_5_phone\" style=\"min-height:13px\" aria-hidden=\"false\"> Phone Number <\/label>\n            <\/span>\n          <\/div>\n        <\/div>\n      <\/li>\n      <li class=\"form-line jf-required\" data-type=\"control_fileupload\" id=\"id_6\">\n        <label class=\"form-label form-label-top form-label-auto\" id=\"label_6\" for=\"input_6\">\n          Attach Your Resume\n          <span class=\"form-required\">\n            *\n          <\/span>\n        <\/label>\n        <div id=\"cid_6\" class=\"form-input-wide jf-required\" data-layout=\"full\">\n          <div class=\"jfQuestion-fields\" data-wrapper-react=\"true\">\n            <div class=\"jfField isFilled\">\n              <div class=\"jfUpload-wrapper\">\n                <div class=\"jfUpload-container\">\n                  <div class=\"jfUpload-text-container\">\n                    <div class=\"jfUpload-icon forDesktop\">\n                      <span class=\"iconSvg  dhtupload \">\n                        <svg viewBox=\"0 0 54 47\" version=\"1.1\" xmlns=\"http:\/\/www.w3.org\/2000\/svg\">\n                          <g stroke=\"none\" strokeWidth=\"1\" fill=\"none\">\n                            <g transform=\"translate(-1506.000000, -2713.000000)\">\n                              <g transform=\"translate(1421.000000, 2713.000000)\">\n                                <path d=\"M125.212886,10.1718048 C127.110227,10.3826204 128.89335,10.9096517 130.562307,11.7529143 C132.231264,12.596177 133.689384,13.676591 134.93671,14.9941889 C136.184036,16.3117868 137.167828,17.8226097 137.888114,19.5267029 C138.608401,21.2307962 138.968539,23.049054 138.968539,24.9815309 C138.968539,26.8086 138.687456,28.6356416 138.125281,30.4627107 C137.563106,32.2897797 136.746207,33.9323605 135.674561,35.3905021 C134.602915,36.8486438 133.267769,38.0520318 131.669084,39.0007022 C130.070398,39.9493727 128.217005,40.4588363 126.108848,40.5291081 L122.261482,40.5291081 C121.804714,40.5291081 121.409441,40.3622149 121.07565,40.0284235 C120.741858,39.694632 120.574965,39.2993586 120.574965,38.8425913 C120.574965,38.385824 120.741858,37.9905506 121.07565,37.6567591 C121.409441,37.3229677 121.804714,37.1560744 122.261482,37.1560744 L126.108848,37.1560744 C127.549422,37.1560744 128.858216,36.7871526 130.03527,36.0492978 C131.212324,35.3114429 132.222468,34.3627867 133.06573,33.2033006 C133.908993,32.0438144 134.558998,30.743804 135.015765,29.3032303 C135.472533,27.8626567 135.700913,26.4221046 135.700913,24.9815309 C135.700913,23.4004134 135.384694,21.9159421 134.752247,20.5280723 C134.1198,19.1402026 133.258983,17.9280307 132.169768,16.8915204 C131.080554,15.85501 129.833247,15.0293277 128.427809,14.4144487 C127.022371,13.7995697 125.529116,13.4921348 123.947999,13.4921348 L122.735815,13.4394312 L122.366889,12.2799508 C121.48849,9.46907537 120.07429,7.28189569 118.124245,5.71834621 C116.1742,4.15479672 113.53026,3.37303371 110.192346,3.37303371 C108.084189,3.37303371 106.186876,3.73317173 104.500351,4.45345857 C102.813826,5.17374541 101.36449,6.17510478 100.1523,7.45756671 C98.9401098,8.74002865 98.0090213,10.2684193 97.3590063,12.0427844 C96.7089914,13.8171496 96.3839888,15.7232459 96.3839888,17.7611306 L96.4366924,17.7611306 L96.5420997,19.3422402 L95.0136938,19.6057584 C93.1514888,19.9219819 91.5703951,20.9233413 90.2703652,22.6098666 C88.9703353,24.2963919 88.3203301,26.1937043 88.3203301,28.301861 C88.3203301,30.6911051 89.1196608,32.7640947 90.7183462,34.5208919 C92.3170316,36.277689 94.2055603,37.1560744 96.3839888,37.1560744 L101.232725,37.1560744 C101.724628,37.1560744 102.128685,37.3229677 102.444909,37.6567591 C102.761132,37.9905506 102.919242,38.385824 102.919242,38.8425913 C102.919242,39.2993586 102.761132,39.694632 102.444909,40.0284235 C102.128685,40.3622149 101.724628,40.5291081 101.232725,40.5291081 L96.3839888,40.5291081 C94.8380073,40.5291081 93.3798875,40.2041055 92.0095857,39.5540906 C90.6392839,38.9040756 89.4358959,38.0169064 88.3993855,36.8925562 C87.3628752,35.768206 86.5371929,34.4681956 85.9223139,32.992486 C85.3074349,31.5167763 85,29.9532503 85,28.301861 C85,25.5963933 85.7554115,23.1544819 87.266257,20.9760534 C88.7771026,18.7976249 90.7095505,17.3395051 93.0636587,16.6016503 C93.2042025,14.2475421 93.7224499,12.0603624 94.6184164,10.0400456 C95.514383,8.0197289 96.7089871,6.26295807 98.2022647,4.76968048 C99.6955423,3.27640288 101.452313,2.10815028 103.47263,1.26488764 C105.492947,0.421624997 107.732829,0 110.192346,0 C112.089686,0 113.82889,0.237164061 115.410007,0.711499298 C116.991124,1.18583453 118.414109,1.8621913 119.679003,2.74058989 C120.943897,3.61898847 122.033095,4.69061868 122.946629,5.95551264 C123.860164,7.22040661 124.615575,8.62582326 125.212886,10.1718048 Z M113.249157,23.611236 L119.468188,30.4627107 C119.71414,30.7086623 119.837114,30.9985295 119.837114,31.3323209 C119.837114,31.6661124 119.71414,31.9735473 119.468188,32.2546348 L119.046559,32.5181531 C118.835743,32.7641047 118.563444,32.8607271 118.229652,32.8080232 C117.895861,32.7553193 117.605994,32.6059937 117.360042,32.3600421 L113.670787,28.2491573 L113.670787,45.2197331 C113.670787,45.7116364 113.503893,46.1156936 113.170102,46.4319171 C112.83631,46.7481406 112.441037,46.90625 111.98427,46.90625 C111.492366,46.90625 111.088309,46.7481406 110.772086,46.4319171 C110.455862,46.1156936 110.297753,45.7116364 110.297753,45.2197331 L110.297753,28.2491573 L106.713904,32.2546348 C106.467953,32.5005864 106.178086,32.649912 105.844294,32.7026159 C105.510503,32.7553198 105.220636,32.6586974 104.974684,32.4127458 L104.553055,32.1492275 C104.307103,31.86814 104.184129,31.5607051 104.184129,31.2269136 C104.184129,30.8931222 104.307103,30.603255 104.553055,30.3573034 L110.666678,23.611236 L110.666678,23.5585323 L111.088308,23.1369031 C111.193715,22.9963593 111.325473,22.8997369 111.483585,22.847033 C111.641697,22.7943291 111.791022,22.7679775 111.931566,22.7679775 C112.107246,22.7679775 112.265355,22.7943291 112.405899,22.847033 C112.546443,22.8997369 112.686984,22.9963593 112.827528,23.1369031 L113.249157,23.5585323 L113.249157,23.611236 Z\">\n                                <\/path>\n                              <\/g>\n                            <\/g>\n                          <\/g>\n                        <\/svg>\n                      <\/span>\n                    <\/div>\n                  <\/div>\n                  <div class=\"jfUpload-button-container\">\n                    <div class=\"jfUpload-button\" aria-hidden=\"true\" tabindex=\"0\" style=\"display:none\" data-version=\"v2\">\n                      Browse Files\n                      <div class=\"jfUpload-heading forDesktop\">\n                        Drag and drop files here\n                      <\/div>\n                      <div class=\"jfUpload-heading forMobile\">\n                        Choose a file\n                      <\/div>\n                    <\/div>\n                  <\/div>\n                <\/div>\n                <div class=\"jfUpload-files-container\">\n                  <input type=\"file\" id=\"input_6\" name=\"q6_file[]\" multiple=\"\" class=\"form-upload-multiple validate[required]\" data-imagevalidate=\"yes\" data-file-accept=\"pdf, doc, docx\" data-limit-file-size=\"Yes\" data-file-maxsize=\"10854\" data-file-minsize=\"0\" data-file-limit=\"\" data-component=\"fileupload\" required=\"\" aria-label=\"Browse Files\" \/>\n                <\/div>\n              <\/div>\n              <span class=\"form-sub-label-container\" style=\"vertical-align:top\">\n                <label class=\"form-sub-label\" for=\"input_6\" id=\"sublabel_input_6\" style=\"min-height:13px\" aria-hidden=\"false\"> We accept pdf, doc, docx <\/label>\n              <\/span>\n            <\/div>\n            <span style=\"display:none\" class=\"cancelText\">\n              Cancel\n            <\/span>\n            <span style=\"display:none\" class=\"ofText\">\n              of\n            <\/span>\n          <\/div>\n        <\/div>\n      <\/li>\n      <li class=\"form-line\" data-type=\"control_button\" id=\"id_2\">\n        <div id=\"cid_2\" class=\"form-input-wide\" data-layout=\"full\">\n          <div data-align=\"auto\" class=\"form-buttons-wrapper form-buttons-auto   jsTest-button-wrapperField\">\n            <button id=\"input_2\" type=\"submit\" class=\"form-submit-button form-submit-button-simple_blue submit-button jf-form-buttons jsTest-submitField\" data-component=\"button\" data-content=\"\">\n              Submit\n            <\/button>\n          <\/div>\n        <\/div>\n      <\/li>\n      <li style=\"display:none\">\n        Should be Empty:\n        <input type=\"text\" name=\"website\" value=\"\" \/>\n      <\/li>\n    <\/ul>\n  <\/div>\n  <script>\n  JotForm.showJotFormPowered = \"new_footer\";\n  <\/script>\n  <script>\n  JotForm.poweredByText = \"Powered by Jotform\";\n  <\/script>\n  <input type=\"hidden\" class=\"simple_spc\" id=\"simple_spc\" name=\"simple_spc\" value=\"221233199546054\" \/>\n  <script type=\"text\/javascript\">\n  var all_spc = document.querySelectorAll(\"form[id='221233199546054'] .si\" + \"mple\" + \"_spc\");\nfor (var i = 0; i < all_spc.length; i++)\n{\n  all_spc[i].value = \"221233199546054-221233199546054\";\n}\n  <\/script>\n  <\/div>\n  <\/div>\n<\/form><\/body>\n<\/html>\n<script src=\"https:\/\/cdn.jotfor.ms\/\/js\/vendor\/smoothscroll.min.js?v=3.3.33049\"><\/script>\n<script src=\"https:\/\/cdn.jotfor.ms\/\/js\/errorNavigation.js?v=3.3.33049\"><\/script>\n", "F", Array);
(function () {
    window.handleIFrameMessage = function (e) {
        if (!e.data || !e.data.split) return;
        var args = e.data.split(":");
        if (args[2] != "221233199546054") {
            return;
        }
        var iframe = document.getElementById("221233199546054");
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