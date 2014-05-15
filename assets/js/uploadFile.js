$(document).ready(function () {
    nextStep('uploadFile');
    function beforeSubmit() {
        var exists = $('#file')[0].files[0];
        if (exists) {
            //check whether client browser fully supports all File API
            if (window.File && window.FileReader && window.FileList && window.Blob) {
                var fsize = $('#file')[0].files[0].size;
                var ftype = $('#file')[0].files[0].type;
                //allow file types
                switch (ftype) {
                    case 'application/vnd.ms-excel':
                        break;
                    default:
                        $("#output").html("<div class='wrongMessage'>Попытка загрузить файл с неверным форматом!(<b>" + ftype + "</b>).  Необходимо загрузить файл в формате <b>*.xls</b></div>");
                        return false
                }

                //Проверяем, если размер файла больше 100 MB (1048576 = 1 mb)
                if (fsize > 104857600) {
                    $("#output").html("<div class='wrongMessage'>Размер файла превышает позволенный максимум (100МБ)!</div>");
                    return false
                }
            }
            else {
                alert("Пожалуйста, обновите свой браузер, так как у вашего браузера не хватает некоторых новых функций!");
                return false
            }
        } else {
            $("#output").html("<div class='wrongMessage'>Выберите файл!</div>");
            return false
        }
    }

    function OnProgress(event, position, total, percentComplete) {
        //Progress bar
        $('#progressbox').show();
        $('#progressbar').width(percentComplete + '%'); //update progressbar percent complete
        $('#statustxt').html(percentComplete + '%'); //update status text
        if (percentComplete > 50) {
            $('#statustxt').css('color', '#000'); //change status text to white after 50%
        }
    }

    function afterSuccess(res) {
        currentSessionId = res.sessionId;
    }

    var options = {
        target: '#output',   // target element(s) to be updated with server response
        beforeSubmit: beforeSubmit,  // pre-submit callback
        uploadProgress: OnProgress, //upload progress callback
        success: afterSuccess,
        resetForm: false        // reset the form after successful submit
    };

    $('#form').submit(function (e) {
        $(this).ajaxSubmit(options);
        return false;
    });
});