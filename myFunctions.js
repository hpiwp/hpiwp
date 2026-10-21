$(function () {
    $("#page").css("opacity", 0).animate({ opacity: 1 }, 500);
    $("#side a").hover(function () { $(this).animate({ paddingRight: "30px" }, 120); },
        function () { $(this).animate({ paddingRight: "22px" }, 120); });
    $("#side a.exit").click(function (ev) {
        if (!confirm("هل تريد الخروج من الموقع؟")) { ev.preventDefault(); }
    });
    if ($("#fleet").length) { setupFleet(); }
});

function setupFleet() {
    $("#reserve").attr("novalidate", "novalidate");

    $(".chkInfo").change(function () {
        var box = $(this).closest("tr").find(".more");
        if (this.checked) { box.slideDown(250); } else { box.slideUp(250); }
    });

    $(".chkPick").change(function () {
        var n = $(".chkPick:checked").length;
        $("#pickCount").text(n > 0 ? "(تم اختيار " + n + ")" : "");
    });

    $("#goBtn").click(function () {
        if ($(".chkPick:checked").length === 0) { alert("اختر سيارة واحدة على الأقل."); return; }
        $("#reserve").slideDown(350);
        $("html, body").animate({ scrollTop: $("#reserve").offset().top - 20 }, 450);
    });

    $("#reserve").submit(function (ev) {
        ev.preventDefault();
        if (runChecks()) { buildSummary(); }
    });
}


function toDate(s) {
    var p = s.split("-");
    if (p.length !== 3 || p[0].length !== 4 || p[1].length !== 2 || p[2].length !== 2) { return null; }
    var y = Number(p[0]), m = Number(p[1]), d = Number(p[2]);
    if (isNaN(y) || isNaN(m) || isNaN(d)) { return null; }
    var dt = new Date(Date.UTC(y, m - 1, d));
    var same = dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
    return same ? dt : null;
}

var rules = {
    fullName: function (v) {
        if (v === "") { return ""; }
        var words = v.split(" ");
        for (var i = 0; i < words.length; i++) {
            if (!/^[\u0621-\u064A]+$/.test(words[i])) { return "الاسم بأحرف عربية فقط وبمسافة واحدة بين الكلمات."; }
        }
        return words.length < 2 ? "اكتب الاسم الكامل (كلمتان على الأقل)." : "";
    },
    nid: function (v) {
        if (v === "") { return "حقل إلزامي."; }
        if (v.length !== 11 || isNaN(v) || v.indexOf(".") >= 0 || v.indexOf("+") >= 0 || v.indexOf("-") >= 0) { return "11 رقماً بالضبط."; }
        var g = Number(v.substr(0, 2));
        return (g >= 1 && g <= 14) ? "" : "أول رقمين (رمز المحافظة) من 01 إلى 14.";
    },
    from: function (v) {
        if (v === "") { return "حقل إلزامي."; }
        return toDate(v) ? "" : "الصيغة المطلوبة yyyy-mm-dd وبتاريخ صحيح.";
    },
    to: function (v, all) {
        if (v === "") { return "حقل إلزامي."; }
        var e = toDate(v);
        if (!e) { return "الصيغة المطلوبة yyyy-mm-dd وبتاريخ صحيح."; }
        var s = toDate(all.from);
        return (s && e.getTime() <= s.getTime()) ? "يجب أن يكون بعد تاريخ البداية." : "";
    },
    phone: function (v) {
        if (v === "") { return ""; }
        var local = v.replace(/^(\+963|00963)/, "0");
        var okNet = /^09(3|8|9)\d{7}$/.test(local) || /^09(4|5|6)\d{7}$/.test(local);
        return okNet ? "" : "الرقم لا يخص Syriatel (093/098/099) أو MTN (094/095/096).";
    },
    mail: function (v) {
        if (v === "") { return ""; }
        return /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(v) ? "" : "صيغة البريد غير صحيحة.";
    }
};

function runChecks() {
    var vals = {}, valid = true;
    $.each(rules, function (id) { vals[id] = trimValue("#" + id); });
    $.each(rules, function (id, fn) {
        var msg = fn(vals[id], vals);
        var input = $("#" + id);
        input.toggleClass("invalid", msg !== "");
        input.siblings(".msg").text(msg);
        if (msg !== "") { valid = false; }
    });
    return valid;
}

function trimValue(selector) {
    return String($(selector).val() || "").replace(/^\s+|\s+$/g, "");
}

function buildSummary() {
    var days = Math.round((toDate(trimValue("#to")) - toDate(trimValue("#from"))) / 864e5);
    var lines = [], total = 0;
    var picks = $(".chkPick:checked").get();
    for (var i = 0; i < picks.length; i++) {
        var tr = $(picks[i]).closest("tr");
        var price = Number(tr.find(".price").text());
        total += price * days;
        lines.push("<tr><td>" + tr.find(".model").text() + "</td><td>" + days + " يوم</td><td>" + (price * days).toLocaleString("en-US") + "</td></tr>");
    }
    var disc = days > 10 ? total * 0.5 : 0;
    var out = "<h2>تم استلام طلبك</h2>";
    var nm = trimValue("#fullName");
    if (nm) { out += "<p>مرحباً " + nm + "، هذا ملخص حجزك:</p>"; }
    out += "<table><tr><th>السيارة</th><th>مدة التأجير</th><th>التكلفة (ل.س)</th></tr>" + lines.join("") + "</table>";
    out += "<p>المجموع قبل الخصم: <b>" + total.toLocaleString("en-US") + "</b> ل.س</p>";
    out += "<p>الخصم (" + (disc > 0 ? "5% لأن المدة أكثر من 10 أيام" : "لا يوجد") + "): <b>" + disc.toLocaleString("en-US") + "</b> ل.س</p>";
    out += "<p>المبلغ النهائي: <b>" + (total - disc).toLocaleString("en-US") + "</b> ل.س</p>";
    $("#summary").html(out).hide().slideDown(400);
    $("html, body").animate({ scrollTop: $("#summary").offset().top - 20 }, 450);
}
