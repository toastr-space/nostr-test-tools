<script lang="ts">
	import {
		generatePrivateKey,
		getPublicKey,
		nip19,
		finishEvent,
		type EventTemplate
	} from 'nostr-tools';
	import { get, writable, type Writable } from 'svelte/store';
	import { JsonView } from '@zerodevx/svelte-json-view';
	import { SimplePool } from 'nostr-tools';

	const pool = new SimplePool();

	let relays = ['wss://relay.damus.io', 'wss://nos.lol', 'wss://nostr.wine'];

	let globalPrivateKey = writable('');
	let nsec = writable('');
	let PublicKey = '';

	let hidePrivateKey = true;

	// nostr event data
	let kind = 1;
	let content = 'Text Content';
	let tags = [['p', 'HEX KEY', 'wss://alice.relay.com/', 'alice']];

	function addTag() {
		tags = [...tags, ['p', 'HEX KEY', 'wss://bob.relay.com/', 'bob']];
	}

	function removeTag(index: number) {
		tags = [...tags.slice(0, index), ...tags.slice(index + 1)];
	}

	function updateTag(
		index: number,
		event: Event & { currentTarget: EventTarget & HTMLInputElement }
	) {
		tags = [...tags];
		tags[index] = event.currentTarget.value.split(',').map((str) => str.trim());
	}

	let signedEvent = {};
	let metaData: any = {};

	$: {
		if ($globalPrivateKey.length > 62) {
			// Set nsec
			nsec.set($globalPrivateKey);
			const hexKey = checkNSEC($globalPrivateKey);
			console.log(hexKey);
			if (hexKey) {
				PublicKey = getPublicKey(hexKey);
			}
			// Set the global private key to Hex
			if (hexKey) {
				$globalPrivateKey = hexKey;
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
		if (typeof window !== 'undefined' && window.nostr) {
			window.nostr.getPublicKey().then((res) => {
				$globalPrivateKey = '';
				PublicKey = res;
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

	function signEvent(nip07 = true) {
		console.log($globalPrivateKey);

		signedEvent = {};
		let unsignedEvent: EventTemplate = {
			kind,
			content,
			tags,
			created_at: Math.floor(new Date().getTime() / 1000)
		};

		if (nip07) {
			if (typeof window !== 'undefined' && window.nostr) {
				window['nostr'].signEvent(unsignedEvent).then((res) => {
					console.log(res);
					signedEvent = res;
				});
			}
		} else {
			if ($globalPrivateKey.length < 63) {
				return;
			}
			signedEvent = finishEvent(unsignedEvent, $globalPrivateKey);
		}
	}
</script>

<div class="p-4 w-full">
	<span class="text-3xl"> Nostr - Test Tools </span>
	<span class="divider" />
	<div class="flex flex-row gap-2 items-center">
		<span>Private Key</span>
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
		<span>Hex PubKey</span>
		<input type="text" class="input input-bordered" bind:value={PublicKey} />
	</div>
	<span class="divider" />
	<div class="flex flex-wrap p-4 gap-4 justify-center">
		<div class="flex flex-col gap-2 md:w-4/12 border-2 border-secondary p-4">
			<span class="text-lg font-medium">Get PubKey</span>
			<hr />

			<div class="flex flex-wrap items-center w-full gap-2">
				<span class="w-full">Private Key</span>
				<input
					type="password"
					bind:value={$globalPrivateKey}
					class="grow input input-bordered p-2"
					placeholder="Private Key (nsec or hex)"
				/>
				<button
					class="btn"
					on:click={() => {
						$globalPrivateKey = generatePrivateKey();
					}}
				>
					New
				</button>

				<button
					class="btn"
					class:btn-disabled={$globalPrivateKey.length < 63}
					on:click={() => {
						navigator.clipboard.writeText($globalPrivateKey);
					}}
				>
					Copy
				</button>
			</div>
			<span class="divider">or</span>
			<button class="btn btn-primary w-full" on:click={Nip07GetPubkey}>Get With NIP07</button>
			<span class="text-lg break-all font-mono">
				HEX: <b class="text-success font-normal">{PublicKey}</b><br />
				NPUB: {PublicKey.length > 0 ? nip19.npubEncode(PublicKey) : ''}
			</span>
		</div>
		<div class="flex flex-col gap-2 md:w-7/12 border-2 border-secondary p-4">
			<span class="text-lg font-medium">Create and Sign Event</span>
			
			<label for="inputfield" class="block text-sm font-medium text-gray-700">Kind</label>
			<input id="inputfield" type="number" class="input input-bordered" bind:value={kind} />

			
			<label for="inputfield" class="block text-sm font-medium text-gray-700">Content</label>
			<textarea bind:value={content} class="input input-bordered h-32 p-2"></textarea>
			{#each tags as tag, index (index)}
				<div class="flex flex-wrap items-center w-full gap-2">
					<input
						type="text"
						bind:value={tag}
						on:input={(event) => updateTag(index, event)}
						class="grow input input-bordered"
					/>
					<button class="btn" on:click={() => removeTag(index)}>Remove</button>
				</div>
			{/each}

			<label for="inputfield" class="block text-sm font-medium text-gray-700">Tags</label>
			<button class="btn btn-secondary" on:click={addTag}>Add Tag</button>
			<button class="btn btn-primary w-full" on:click={() => signEvent(true)}
				>Sign Event with Extension (NIP07)</button
			>
			<span class="divider">or</span>
			<button
				class="btn btn-primary w-full"
				disabled={$globalPrivateKey.length < 63}
				on:click={() => signEvent(false)}>Sign Event with PrivateKey</button
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
		<div class="flex flex-col gap-2 md:w-8/12 border-2 border-secondary p-4">
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
