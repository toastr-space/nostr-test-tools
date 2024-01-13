<script lang="ts">
	import { generatePrivateKey, getPublicKey, nip19, finishEvent, type Event } from 'nostr-tools';
	import { get, writable, type Writable } from 'svelte/store';
	import { JsonView } from '@zerodevx/svelte-json-view';
	import { SimplePool } from 'nostr-tools';

	const pool = new SimplePool();

	let relays = ['wss://relay.damus.io', 'wss://nos.lol', 'wss://nostr.wine'];

	let privateKey = '';
	let PublicKey = '';

	let hidePrivateKey = true;
	let globalPrivateKey = writable('');
	let event: Writable<Event<1>> = writable({
		kind: 1,
		content: 'Text Content',
		tags: [['type', 'review', 'rating']],
		created_at: 1702644231,
		pubkey: '525f8a81277e28ddb6f8bab0ceba8656f07c584730e74931a2942b4ad2590939',
		id: 'b4ee7f64b6a8f26151d27c803d3de07c7c6bd40d6a69ee65f0e47fc14c80d822',
		sig: ''
	});

	let eventText = JSON.stringify($event);

	$: {
		event.set(JSON.parse(eventText));
	}

	let metaData: any = {};

	// const { subscribe, set } = writable('Enokas is the king');
	// console.log(get({ subscribe }));

	$: {
		if (privateKey.length > 62) {
			const key = checkNSEC(privateKey);
			if (key) {
				PublicKey = getPublicKey(key);
			}
		}
	}

	const getNewPrivate = () => {
		globalPrivateKey.set(generatePrivateKey());
	};

	function checkNSEC(value: string): string | undefined {
		if (value?.length < 63) {
			return;
		}

		let decodedValue;

		if (value?.toString().startsWith('nsec')) {
			try {
				decodedValue = nip19.decode(value).data;
			} catch (e) {
				return;
			}
		} else if (value?.length === 64) {
			decodedValue = value;
		} else {
			return;
		}
		return decodedValue as string;
	}

	function Nip07GetPubkey() {
		if (typeof window !== 'undefined' && window['nostr']) {
			window['nostr'].getPublicKey().then((res) => {
				privateKey = '';
				PublicKey = res;
				$event.pubkey = res;
			});
		}
	}

	async function getRelays() {
		if (PublicKey.startsWith('npub')) {
			PublicKey = nip19.decode(PublicKey).data as string;
		}
		const data = await pool.get(relays, {
			kinds: [10002],
			authors: [PublicKey]
		});

		console.log(data);
		metaData = data;
	}

	async function getMetaDataProfile() {
		const data = await pool.get(relays, {
			kinds: [0],
			authors: [PublicKey]
		});

		console.log(data);
		metaData = data;
	}

	function getSignedEvent(event: any, nip07 = true) {
		if (nip07) {
			if (typeof window !== 'undefined' && window['nostr']) {
				window['nostr'].signEvent(event).then((res) => {
					console.log(res);
					signedEvent = res;
				});
			}
		} else {
			signedEvent = finishEvent(event, $globalPrivateKey);
		}
	}

	let signedEvent = {};
</script>

<div class="p-4 w-full">
	<span class="text-3xl"> Nostr - Test Tools </span>
	<span class="divider" />
	<div class="flex flex-row gap-2 items-center">
		<span>Global Private Key</span>
		{#if hidePrivateKey}
			<input
				type="password"
				class="input input-bordered"
				bind:value={$globalPrivateKey}
				placeholder="Private Key or Nsec"
			/>
		{:else}
			<input
				type="text"
				class="input input-bordered"
				class:appearance-none={hidePrivateKey}
				bind:value={$globalPrivateKey}
				placeholder="Private Key or Nsec"
			/>
		{/if}
		<button class="btn btn-square w-24" on:click={getNewPrivate}> Generate </button>
		<button class="btn btn-square w-44" on:click={() => (hidePrivateKey = !hidePrivateKey)}>
			Hide/Show Private key
		</button>
		<input type="text" class="input input-bordered" bind:value={PublicKey} />
	</div>
	<span class="divider" />
	<div class="flex flex-wrap p-4 gap-4">
		<div class="flex flex-col gap-2 md:w-4/12 border-2 p-4">
			<span class="text-lg font-medium">Get PublicKey</span>
			<hr />

			<div class="flex flex-wrap items-center w-full gap-2">
				<span class="w-full">Private Key</span>
				<input
					type="password"
					bind:value={privateKey}
					class="grow border w-full border-gray-400 h-14 rounded-md p-2"
					placeholder="Private Key (nsec or hex)"
				/>
				<button
					class="btn"
					on:click={() => {
						privateKey = generatePrivateKey();
					}}
				>
					New
				</button>

				<button
					class="btn"
					class:btn-disabled={privateKey.length < 63}
					on:click={() => {
						navigator.clipboard.writeText(privateKey);
					}}
				>
					Copy
				</button>
				<button
					class="btn"
					class:btn-disabled={$globalPrivateKey.length < 63}
					on:click={() => {
						privateKey = $globalPrivateKey;
					}}
				>
					Global Key
				</button>
			</div>
			<span class="divider">or</span>
			<button class="btn btn-primary w-full" on:click={Nip07GetPubkey}>Get With Nip07</button>
			<span class="text-lg break-all font-mono">
				Result: <b class="text-success font-normal">{PublicKey}</b><br />
				NPUB: {nip19.npubEncode(PublicKey)}
			</span>
		</div>
		<div class="flex flex-col gap-2 md:w-6/12 border-2 p-4">
			<span class="text-lg font-medium">Sign Event</span>
			<textarea bind:value={eventText} class="input input-bordered h-32 p-2"></textarea>
			<span class="divider">or</span>
			<button class="btn btn-primary w-full" on:click={() => getSignedEvent($event, true)}
				>SignEvent</button
			>
			<span class="text-lg break-all font-mono"> Result:</span>
			<span class="mockup-code break-all overflow-hidden w-full"
				><pre class="break-all"><JsonView json={signedEvent} /></pre></span
			>
			<button
				class="btn"
				on:click={() => navigator.clipboard.writeText(JSON.stringify(signedEvent))}
			>
				Copy
			</button>
		</div>
		<div class="flex flex-col gap-2 md:w-6/12 border-2 p-4">
			<span class="text-lg font-medium">Get MetaData</span>
			<button class="btn btn-primary w-full" on:click={() => getMetaDataProfile()}
				>Get Profile Information</button
			>
			<span class="divider">or</span>
			<button class="btn btn-primary w-full" on:click={() => getRelays()}>Get Relays List</button>
			<span class="text-lg break-all font-mono"> Result:</span>
			<span class="mockup-code break-all overflow-hidden w-full"
				><pre class="break-all"><JsonView json={metaData} /></pre></span
			>
			<button class="btn"> Copy </button>
		</div>
	</div>
</div>

<style>
	.mockup-code {
		font-family: monospace;
		font-size: 16px;
		--jsonValColor: blue;
		--jsonPaddingLeft: 2.5rem;
	}
</style>
