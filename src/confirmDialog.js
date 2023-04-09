function confirmDialog(message) {
    if (confirmVisible) {
        return new Promise((resolve) => {
            resolve(false)
        });
    }
    return new Promise((resolve) => {
        confirmVisible = true;
        // Create the dialog box element
        let confirmDialog = document.createElement("div");
        confirmDialog.id = "confirmDialog";
        confirmDialog.innerHTML = "<style>" +
            "#confirmDialog ul li {" +
            "  list-style-type: disc;" +
            "  margin-bottom: 10px;" +
            "  font-size: 14px;" +
            "  line-height: 1.5;" +
            "}" +
            "</style>" +
            message +
            "<div id='buttonsContainer'>" +
            "<button id='confirmYes'>Yes</button>" +
            "<button id='confirmNo'>No</button>" +
            "</div>";
        document.body.appendChild(confirmDialog);

        // Get the yes and no buttons
        let confirmYes = document.getElementById("confirmYes");
        let confirmNo = document.getElementById("confirmNo");

        // Add event listeners to the buttons
        confirmYes.addEventListener("click", function () {
            document.body.removeChild(confirmDialog);
            confirmVisible = false
            resolve(true);
        });

        confirmNo.addEventListener("click", function () {
            document.body.removeChild(confirmDialog);
            confirmVisible = false
            resolve(false);
        });

        // Show the confirm dialog
        confirmDialog.style.display = "block";

        // Add CSS styles to the dialog box
        confirmDialog.style.position = "fixed";
        confirmDialog.style.bottom = "80px";
        confirmDialog.style.left = "55%";
        confirmDialog.style.transform = "translate(-50%, -50%)";
        confirmDialog.style.backgroundColor = "#fff";
        confirmDialog.style.borderRadius = "10px";
        confirmDialog.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.3)";
        confirmDialog.style.padding = "20px";
        confirmDialog.style.textAlign = "start";
        confirmDialog.style.zIndex = "9999";
        confirmDialog.style.paddingLeft = "40px";

        let buttonStyle = "background-color: #0077ff; " +
            "color: #fff; " +
            "border: none; " +
            "padding: 10px 20px; " +
            "border-radius: 5px; " +
            "cursor: pointer; " +
            "margin: 10px;";

        confirmYes.style.cssText = buttonStyle;
        confirmNo.style.cssText = buttonStyle;

        // Add CSS styles to the buttons container
        let buttonsContainer = document.getElementById("buttonsContainer");
        buttonsContainer.style.display = "flex";
        buttonsContainer.style.justifyContent = "center";
        buttonsContainer.style.marginTop = "10px";
    });
}
