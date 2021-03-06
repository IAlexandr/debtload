var currentSessionId = 0;

socket.on('prepReportCompleted', function (err, session) {
    if (err) {
        nextStep(session.state);
        $("#outputfileLoaded").html("<div class='wrongMessage'><b>Произошла ошибка: </b> " + err + "</div>");
    } else {
        if (session.id == currentSessionId) {
            nextStep(session.state);
            // todo вывести предварительный отчет
            var report = JSON.parse(session.prepReport);
            document.getElementById("FsTotalQuantity").innerHTML = report.FsObjInDebtsData.totals;
            document.getElementById("FsUpdateQuantity").innerHTML = report.FsObjInDebtsData.founds;

            document.getElementById("FsFoundObjList").innerHTML = report.FsObjInDebtsData.foundList;

            document.getElementById("FsMissQuantity").innerHTML = report.FsObjInDebtsData.unfounds;
            document.getElementById("FsMissObjList").innerHTML = report.FsObjInDebtsData.unfoundList;

            document.getElementById("DebtsTotalQuantity").innerHTML = report.DebtsDataInFsObj.totals;
            document.getElementById("DebtsUpdateQuantity").innerHTML = report.DebtsDataInFsObj.founds;

            document.getElementById("DebtsFoundObjList").innerHTML = report.DebtsDataInFsObj.foundList;
            document.getElementById("DebtsCopyQuantity").innerHTML = report.DebtsDataInFsObj.foundList.length;

            document.getElementById("DebtsMissQuantity").innerHTML = report.DebtsDataInFsObj.unfounds;
            document.getElementById("DebtsMissObjList").innerHTML = report.DebtsDataInFsObj.unfoundList;
        }
    }
});

socket.on('updateReportCompleted', function (err, session) {
    if (err) {
        $("#dataStartUpdateOutput").html("<div class='wrongMessage'><b>Произошла ошибка: </b> " + err + "</div>");
    } else {
        if (session.id == currentSessionId) {
            nextStep('updateReport');
            $("#reportXls").attr("href", "debt/reportToXls?currentSessionId=" + currentSessionId);
            // todo вывести отчет
            var report = JSON.parse(session.updateReport);
            document.getElementById("updateFsTotalQuantity").innerHTML = report.FsObjInDebtsData.totals;
            document.getElementById("updateFsFoundsQuantity").innerHTML = report.FsObjInDebtsData.founds;
            document.getElementById("updateFsMissQuantity").innerHTML = report.FsObjInDebtsData.unfounds;
            document.getElementById("updateFsMissObjList").innerHTML = report.FsObjInDebtsData.unfoundList;

            document.getElementById("updateFsFoundsWithError").innerHTML = report.FsObjInDebtsData.foundsWithError;
            document.getElementById("updateFsUpdated").innerHTML = report.FsObjInDebtsData.updated;

            document.getElementById("updateDebtsTotalQuantity").innerHTML = report.DebtsDataInFsObj.totals;
            document.getElementById("updateDebtsUpdateQuantity").innerHTML = report.DebtsDataInFsObj.founds;
            document.getElementById("updateDebtsMissQuantity").innerHTML = report.DebtsDataInFsObj.unfounds;
            document.getElementById("updateDebtsMissObjList").innerHTML = report.DebtsDataInFsObj.unfoundList;
        }
    }
});

function clearActiveClass() {
    $('li').removeClass('active');
    $(".panel").fadeOut(1000, function () {
        // Animation complete.
    });
}
function nextStep(step) {
    clearActiveClass();
    $('#' + step).addClass('active');
    $('#' + step + "Panel").fadeIn("slow", function () {
        // Animation complete
    });
}


function updateDebts() {

    $.ajax({
        url: "debt/update",
        type: "POST",
        data: {
            currentSessionId: currentSessionId
        },
        dataType: "json",
        success: function (res) {
            nextStep('dataStartUpdate');
            $("#dataStartUpdateOutput").html("<div><b>" + res.message + "</b></div>");
        }
    });
};

var app = angular.module('main', [])
    .controller('journalController', function ($scope) {
        $scope.sessions = [];
        $scope.getSessions = function () {
            $.get( "sessions", function( data ) {
                var updList = _.where(data, {"state": "dataUpdated"});
                $scope.sessions = updList;
                $scope.$apply();
            });
        }
        $scope.getSessions();
    })