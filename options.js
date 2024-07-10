document.addEventListener('DOMContentLoaded', function() {

    let dashboardId, teamworkId;

    chrome.storage.local.get( {
        dashboardId: '',
        teamworkId: '',
    }, function(items) {
        dashboardId = items.dashboardId;
        teamworkId = items.teamworkId;

        document.getElementById('dashboard-id').value    = dashboardId;
        document.getElementById('teamwork-id').value    = teamworkId;
    } );

    const saveOptions = function() {
        dashboardId = document.getElementById('dashboard-id').value;
        teamworkId = document.getElementById('teamwork-id').value;
        chrome.storage.local.set({
            dashboardId: dashboardId,
            teamworkId: teamworkId,
        }, function() {
            // Update status to let user know options were saved.
            let status = document.getElementById('status');
            status.textContent = 'Options saved.';
            setTimeout(function() {
                status.textContent = '';
            }, 750);
        });
    };

    document.getElementById( 'save' ).addEventListener( 'click', saveOptions );

}, false);