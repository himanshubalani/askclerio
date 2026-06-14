import { corsair } from "./corsair";

const main = async () => {
	const res = await corsair.withTenant('himanshu').github.api.repositories.list({
		owner: 'himanshubalani',
		type: 'public',
	})

	console.log(res);
}

main()