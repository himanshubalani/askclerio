import { corsair } from "./corsair";

const main = async () => {
	const res = await corsair.withTenant(
		'user_3F4v01KRUs7EuOMv2EQg0Ig4Wgj' || 'default'
	).googlecalendar.api.events.get({
      calendarId: "primary",
    });

	console.log(res);
}

main()