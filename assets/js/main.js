/**
 * Created by aivanov on 06.05.2014.
 */
/*socket.request('/', {}, function (response) {
 var t = response;
 });*/

var currentSessionId = 0;

socket.on('prepReportCompleted', function (session) {
    if (session.id == currentSessionId) {

        nextStep(session.state);
        // todo вывести предварительный отчет
        var report = JSON.parse(session.prepReport);
        document.getElementById("FsTotalQuantity").innerHTML = report.FsObjInDebtsData.totalFsObjects;
        document.getElementById("FsUpdateQuantity").innerHTML = report.FsObjInDebtsData.updateQuantity;
        document.getElementById("FsMissQuantity").innerHTML = report.FsObjInDebtsData.missQuantity;
        document.getElementById("FsMissObjList").innerHTML = report.FsObjInDebtsData.missList;

        document.getElementById("DebtsTotalQuantity").innerHTML = report.DebtsDataInFsObj.totalDebtsObjects;
        document.getElementById("DebtsUpdateQuantity").innerHTML = report.DebtsDataInFsObj.updateQuantity;
        document.getElementById("DebtsMissQuantity").innerHTML = report.DebtsDataInFsObj.missQuantity;
        document.getElementById("DebtsMissObjList").innerHTML = report.DebtsDataInFsObj.missList;
    }
});

function clearActiveClass() {
    $('li').removeClass('active');
    $('.panel').removeClass('paneShow');
    $( ".panel" ).fadeOut( 1000, function() {
        // Animation complete.
    });
}
function nextStep(step) {
    clearActiveClass();
    $('#' + step).addClass('active');
   // $('#' + step + "Panel").addClass('paneShow');
    $( '#' + step + "Panel" ).fadeIn( "slow", function() {
        // Animation complete
    });
}


function updateDebts () {
    $.ajax({
        url: "debt/debtsUpdate",
        type: "POST",
        data: {
            currentSessionId: currentSessionId
        },
        dataType: "json",
        success: function (res) {
            var t = res;
        }
    });
   /* $.post("debt/debtsUpdate",
        {
            currentSessionId: currentSessionId
        },
        function(data,status){
            alert("Data: " + data + "\nStatus: " + status);
        });*/
}