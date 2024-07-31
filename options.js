document.addEventListener('DOMContentLoaded', function() {

    let dashboardId, teamworkId;

    chrome.storage.local.get( {
        dashboardId: '',
        teamworkId: '',
        harvestId: '',
        harvestApiKey: '',
    }, function(items) {
        dashboardId = items.dashboardId;
        teamworkId = items.teamworkId;
        harvestId = items.harvestId;
        harvestApiKey = items.harvestApiKey;

        document.getElementById('dashboard-id').value    = dashboardId;
        document.getElementById('teamwork-id').value    = teamworkId;
        document.getElementById('harvest-id').value    = harvestId;
        document.getElementById('harvest-api-key').value    = harvestApiKey;
    } );

    const saveOptions = function() {
        dashboardId = document.getElementById('dashboard-id').value;
        teamworkId = document.getElementById('teamwork-id').value;
        harvestId = document.getElementById('harvest-id').value;
        harvestApiKey = document.getElementById('harvest-api-key').value;
        chrome.storage.local.set({
            dashboardId: dashboardId,
            teamworkId: teamworkId,
            harvestId: harvestId,
            harvestApiKey: harvestApiKey,
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
