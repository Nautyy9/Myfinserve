

(function () {
    function b() {
        var a = 280;

        if(screen.width <= 1024) {
            document.getElementById("ecww-widget").setAttribute("style", "position:relative;padding-top:0;height:0;overflow:hidden;padding-bottom:560px");
        } else {
            document.getElementById("ecww-widget").setAttribute("style", "position:relative;padding-top:0;height:0;overflow:hidden;padding-bottom: 330px; ");
        }
           document.getElementById("ecww-widgetwrapper").offsetWidth && (a = 1200);
        document.getElementById("ecww-widget-iframe").setAttribute("style", "position:absolute;top:0;left:0;width:100%;height:100%;");
        // document.getElementById("ecww-widget").setAttribute("style", "position:relative;padding-top:0;height:0;overflow:hidden;padding-bottom:560px");
		document
    }	
    window.onload = function () {
        var a = document.createElement("iframe");
        a.id = "ecww-widget-iframe";
        a.frameBorder = 0;
        a.scrolling = "no";
        a.width = "100%";
        a.height = "100vh";
        a.setAttribute("src", "https://emicalculator.net/widget/2.0/widget.html");
        document.getElementById("ecww-widget").appendChild(a);
        b()
    };
    window.onresize = function () {
        b()
    }
})();