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

	if ( message.harvestId && message.harvestApiKey ) {
		// Parse harvest time entries
		const resHarvest = await fetch(
			`https://api.harvestapp.com/v2/time_entries?from=${message.start}&to=${message.end}`,
			{
				method: 'GET',
				headers: {
					'Harvest-Account-Id': message.harvestId,
					'authorization': `Bearer ${message.harvestApiKey}`,
				}
			});
		const responseHarvest = await resHarvest.json();

		const harvestTimeEntries = responseHarvest['time_entries'];
		harvestTimeEntries.forEach(function(el) {
			const key = `cpt${el.client.id}-${el.project.id}-${el.task.id}`;

			if (timesheet[key] === undefined) {
				timesheet[key] = {
					'client': el.client.name,
					'client_id': el.client.id,
					'project_id': el.project.id,
					'project': el.project.name,
					'task_id': el.task.id,
					'task': el.task.name,
					'hours': parseFloat(el.rounded_hours)
				};
			} else {
				timesheet[key].hours += parseFloat(el.rounded_hours);
			}
		});
	}

	const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });

	if (tab && 'id' in tab) {
		chrome.tabs.sendMessage(
			tab.id,
			{
				type: 'parseTimesheet',
				timeEntries: timesheet,
				startDate: message.start,
			}
		);
	}
};

chrome.runtime.onMessage.addListener(backgroundHandler);
