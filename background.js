const backgroundHandler = async function (message, sender, sendResponse) {
	if (message.type !== "fetchTimesheet") {
		return true;
	}


	const res = await fetch("https://tenup.teamwork.com/time_entries.json?userId=" + message.userId + "&fromdate=" + message.start + '&todate=' + message.end, { method: 'GET' } );
	const response = await res.json();

	const timesheet = {};
	const timeEntries = response['time-entries'];
	timeEntries.forEach( function( el ) {
		const key = `cpt${el['company-name']}-${el['project-id']}-${el['todo-item-id']}`;

		if (timesheet[key] === undefined) {
			timesheet[key] = {
				'client': el['company-name'],
				'client_id': el['company-id'],
				'project_id': el['project-id'],
				'project': el['project-name'],
				'task_id': el['todo-item-id'],
				'task': el['todo-item-name'],
				'hours': parseFloat( el.hoursDecimal )
			};
		} else {
			timesheet[key].hours += parseFloat( el.hoursDecimal );
		}
	} );

	console.log(timesheet)

	const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });

	chrome.tabs.sendMessage(
		tab.id,
		{ 
			type: 'parseTimesheet', 
			timeEntries: timesheet, 
			startDate: message.start,
		}
		);
};

chrome.runtime.onMessage.addListener(backgroundHandler);