<template>
  <div class="transaction-list">
    <h3>Latest Transactions</h3>
    <div class="transactions">
      <div v-for="tx in transactions"
           :key="tx._id"
           class="transaction-item"
           @click="openSolscan(tx.signature)"
           :title="'View on Solscan'">
        <div class="tx-content">
          <div class="tx-from">{{ shortenAddress(tx.from) }}</div>
          <div class="tx-amount">{{ formatAmount(tx.amount) }}</div>
        </div>
        <div class="arrow-icon">
          <svg xmlns="http://www.w3.org/2000/svg"
               width="16"
               height="16"
               viewBox="0 0 24 24"
               fill="none"
               stroke="currentColor"
               stroke-width="2"
               stroke-linecap="round"
               stroke-linejoin="round">
            <line x1="7" y1="17" x2="17" y2="7"></line>
            <polyline points="7 7 17 7 17 17"></polyline>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

interface Transaction {
  _id: string;
  signature: string;
  activity_type: string;
  amount: string;
  blockTime: number;
  from: string;
  slot: number;
}

const props = defineProps<{
  processedIds: Set<string>
}>()

const emit = defineEmits(['new-transactions'])
const transactions = ref<Transaction[]>([])
let isFirstLoad = true

const shortenAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const formatAmount = (amount: string) => {
  return (parseInt(amount) / 1e9).toFixed(2)
}

const openSolscan = (signature: string) => {
  window.open(`https://solscan.io/tx/${signature}`, '_blank')
}

const processNewTransactions = (data: Transaction[]) => {
  if (isFirstLoad) {
    const lastTen = data.slice(0, 10)
    emit('new-transactions', lastTen)
    isFirstLoad = false
    return
  }

  const newTransactions = data.filter(tx => !props.processedIds.has(tx._id))

  if (newTransactions.length > 0) {
    console.log(`${newTransactions.length} new transactions found`)
    emit('new-transactions', newTransactions)
  }
}

const fetchTransactions = async () => {
  try {
    const data = await $fetch('/api/transactions')
    transactions.value = data
    processNewTransactions(data)
  } catch (error) {
    console.error('Error fetching transactions:', error)
  }
}

onMounted(() => {
  fetchTransactions()
  setInterval(fetchTransactions, 5000)
})

watch(transactions, (newVal) => {
  console.log('Transactions updated, total:', newVal.length)
})
</script>

<style scoped>
.transaction-list {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 300px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 15px;
  border-radius: 8px;
  max-height: 80vh;
  overflow-y: auto;
  z-index: 1000;
}

.transaction-item {
  padding: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.transaction-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.tx-content {
  flex: 1;
}

.tx-from {
  font-family: monospace;
  color: #fff;
}

.tx-amount {
  color: #4CAF50;
  margin-top: 4px;
}

.arrow-icon {
  opacity: 0;
  transition: opacity 0.2s;
  color: #888;
}

.transaction-item:hover .arrow-icon {
  opacity: 1;
}

/* Custom Scrollbar */
.transaction-list::-webkit-scrollbar {
  width: 6px;
}

.transaction-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.transaction-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.transaction-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.4);
}
</style>