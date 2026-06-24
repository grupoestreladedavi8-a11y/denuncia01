let gps = null;
let gpsAllowed = false;

function requestGPS() {
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            gps = {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude
            };

            gpsAllowed = true;

            // libera botão quando tiver GPS
            document.getElementById("sendBtn").disabled = false;

        },
        (err) => {
            gpsAllowed = false;

            alert("❌ A localização é obrigatória para continuar.");

            document.getElementById("sendBtn").disabled = true;
        },
        {
            enableHighAccuracy: true,
            timeout: 10000
        }
    );
}

// tenta assim que abrir a página
window.onload = () => {
    document.getElementById("sendBtn").disabled = true;
    requestGPS();
};