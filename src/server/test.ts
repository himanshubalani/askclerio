import { corsair } from "./corsair";

const main = async () => {
	const res = await corsair.withTenant('himanshu').gmail.db.threads.search({
		data: {
			snippet: {
				contains: 'builders'
			}
		}
	})

	console.log(res);
}

main()