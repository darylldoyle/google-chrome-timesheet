const backgroundHandler = async function (message, sender, sendResponse) {
	if (message.type !== "fetchTimesheet") {
		return true;
	}


	const res = await fetch("https://tenup.teamwork.com/time_entries.json?userId=" + message.userId + "&fromdate=" + message.start + '&todate=' + message.end, { method: 'GET' } );
	const response = await res.json();

	const twCompanies = {};

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

		twCompanies[el['company-id']] = el['company-name'];
	} );

	const running = await fetch("https://tenup.teamwork.com/projects/api/v3/me/timers.json?include=projects,tasks&userId" + message.userId, { method: 'GET' } );
	const runningResponse = await running.json();

	// We need to parse the start date into something usable, it's currently yyyymmdd and Date won't parse it.
	// Pull the first four characters for the year, the next two for the month, and the last two for the day.
	const startYear = message.start.substring(0, 4);
	const startMonth = message.start.substring(4, 6);
	const startDay = message.start.substring(6, 8);
	const startDate = new Date(`${startYear}-${startMonth}-${startDay}T00:00:00`);

	// Get the current date.
	const currentDate = new Date();

	// Get the week numbers for the start date and the current date.
	const reportWeek = getWeekNumber(startDate);
	const currentWeek = getWeekNumber(currentDate);

	// Only get running timers if we're looking at the current week.
	const isCurrentWeek = reportWeek.every(item => currentWeek.includes(item));

	// If there are running timers, add them to the timesheet.
	if (runningResponse.timers.length > 0 && isCurrentWeek) {
		for (const elKey in runningResponse.timers) {
			const el = runningResponse.timers[elKey];
			const companyId = runningResponse.included.projects[el.projectId].companyId;
			const projectName = runningResponse.included.projects[el.projectId].name;
			const taskName = runningResponse.included.tasks[el.taskId].name;
			let companyName = '';
			// Check if we already have the company name.
			if ( twCompanies[companyId] ) {
				companyName = twCompanies[companyId];
			} else {
				// If not, fetch the company from the API.
				const company = await fetch(`https://tenup.teamwork.com//projects/api/v3/companies/${companyId}.json`, { method: 'GET' } );
				const companyResponse = await company.json();
				companyName = companyResponse.company.name;
			}

			const key = `cpt${companyName}-${el.project.id}-${el.taskId}`;

			// Calculate the total time for the running timer.
			let totalSeconds = 0;
			el.intervals.forEach( function( interval ) {
				let duration = interval.duration;

				if ( duration > 0 ) {
					totalSeconds += duration;
				} else {
					totalSeconds += ( new Date().getTime() - new Date(interval.from).getTime() ) / 1000;
				}
			});

			// Add the running timer to the timesheet.
			if (timesheet[key] === undefined) {
				timesheet[key] = {
					'client': companyName,
					'client_id': companyId,
					'project_id': el.projectId,
					'project': projectName,
					'task_id': el.taskId,
					'task': taskName,
					'hours': parseFloat( totalSeconds / 3600 )
				};
			} else {
				timesheet[key].hours += parseFloat( totalSeconds / 3600 );
			}
		};
	}

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

		chrome.tabs.sendMessage(
			tab.id,
			{
				type: 'finishTimesheetRefresh',
			}
		);
	}
};

chrome.runtime.onMessage.addListener(backgroundHandler);


function getWeekNumber(d) {
	// Copy date so don't modify original
	d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
	// Set to nearest Thursday: current date + 4 - current day number
	// Make Sunday's day number 7
	d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
	// Get first day of year
	var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
	// Calculate full weeks to nearest Thursday
	var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
	// Return array of year and week number
	return [d.getUTCFullYear(), weekNo];
}
