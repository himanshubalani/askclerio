import { corsair } from "./corsair";

const main = async () => {
	const res = await corsair.withTenant(
		'user_3F4v01KRUs7EuOMv2EQg0Ig4Wgj'
	).googlecalendar.api.events.get({
      calendarId: "primary",
      id: "primary",
    });

	console.log(res);
}

void main()