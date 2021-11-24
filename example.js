interaction.createMessage({
	content: "test",
	components: [{
		type: 1,
		components: [
			{
				type: 2,
				label: "yeeet",
				style: 1,
				emoji: {
					id: "728516668443197490",
					name: "emojigang"
				},
				custom_id: "a"
			}
		]
	}]
}).then(m => {
	const actions = new continuousActionRowStream(m, (id) => id === data.req.member.id, false, {maxMatches: 1, time: 60e3, callback: 6});
	actions.on("action", (...args) => {
		m.edit({
			content: "hi",
			components: [{
				type: 1,
				components: [
					{
						type: 2,
						label: "yeeet",
						style: 1,
						emoji: {
							id: "728516668443197490",
							name: "emojigang"
						},
						custom_id: "a",
						disabled: true
					}
				]
			}]
		});
	});
});