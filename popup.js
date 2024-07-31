document.addEventListener('DOMContentLoaded', function() {

    const dashboardURL = 'https://dashboard.10up.com/blog/10upper/';
    let dashboardId, teamworkId, harvestId, harvestApiKey;
    let timesheet = {};
    let startOfWeek = '';
    let refreshStatsButton = document.getElementById( 'refresh-stats' );

    chrome.storage.local.get({
        dashboardId: '',
        teamworkId: '',
        harvestId: '',
        harvestApiKey: ''
    }, function(items) {
        dashboardId = items.dashboardId;
        teamworkId = items.teamworkId;
        harvestId = items.harvestId;
        harvestApiKey = items.harvestApiKey;

        checkDashboard();
    });

    const handleTimesheet = function() {
        const startDate = moment( startOfWeek ).startOf('isoWeek').format( "YYYYMMDD" )
        const endDate   = moment( startOfWeek ).add(1, 'weeks').startOf('week').format( "YYYYMMDD" )

        chrome.runtime.sendMessage(
            {
                type: 'fetchTimesheet',
                start: startDate,
                end: endDate,
                userId: teamworkId,
                harvestId: harvestId,
                harvestApiKey: harvestApiKey,
            }
        );
    }

    const checkDashboard = function( checkTimesheet ) {

        if ( dashboardId ) {

            chrome.tabs.query({
                'active': true,
                'currentWindow': true
            }, function (tabs) {
                const regex = new RegExp(dashboardURL);
                if (!regex.test(tabs[0].url)) {
                    chrome.tabs.create({'url': dashboardURL + dashboardId + '/'});
                } else {
                    if ( checkTimesheet ) {
                        refreshStatsButton.value = 'Loading...';
                        chrome.tabs.query({
                            'active': true,
                            'currentWindow': true
                        }, function (tabs) {
                            const url = new URL(tabs[0].url);
                            const arg = url.searchParams.get('week');
                            if (arg) {
                                startOfWeek = arg;
                            } else {
                                startOfWeek = moment().format( "YYYY-MM-DD" );
                            }

                            if( 0 === moment( startOfWeek ).day() ) {
                                startOfWeek = moment(startOfWeek).add( 1, 'days' ).format( 'YYYY-MM-DD' );
                            }

                            handleTimesheet();
                            refreshStatsButton.value = 'Refresh Stats';
                        });
                    }
                }
            } );
        } else {
            chrome.tabs.create({ url: "chrome://extensions/?options=" + chrome.runtime.id }, function() {});
        }
    };

    refreshStatsButton.addEventListener( 'click', function() {
        checkDashboard( true );
    } );

} );
