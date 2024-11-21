<template>
  <div class="transaction-list">
    <h3>Son İşlemler</h3>
    <div class="transactions">
      <div v-for="tx in transactions" :key="tx._id" class="transaction-item">
        <div class="tx-from">{{ shortenAddress(tx.from) }}</div>
        <div class="tx-amount">{{ formatAmount(tx.amount) }}</div>
        <div class="tx-time">{{ formatTime(tx.blockTime) }}</div>
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

const formatTime = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleTimeString()
}

const processNewTransactions = (data: Transaction[]) => {
  // İlk yüklemede sadece son 10 transaction'ı işle
  if (isFirstLoad) {
    const lastTen = data.slice(0, 10)
    emit('new-transactions', lastTen)
    isFirstLoad = false
    return
  }

  // Daha önce işlenmemiş transaction'ları filtrele
  const newTransactions = data.filter(tx => !props.processedIds.has(tx._id))

  if (newTransactions.length > 0) {
    console.log(`${newTransactions.length} yeni transaction bulundu`)
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
  // Her 5 saniyede bir güncelle
  setInterval(fetchTransactions, 5000)
})

// Debug için transactions değişimini izle
watch(transactions, (newVal) => {
  console.log('Transactions güncellendi, toplam:', newVal.length)
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
}

.tx-from {
  font-family: monospace;
}

.tx-amount {
  color: #4CAF50;
}

.tx-time {
  font-size: 0.8em;
  color: #888;
}
</style>