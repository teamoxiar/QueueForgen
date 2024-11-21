<template>
  <div>
    <TransactionVisualizer ref="visualizer" />
    <TransactionList @new-transactions="handleNewTransactions" :processed-ids="processedTxIds" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

const visualizer = ref()
const processedTxIds = reactive(new Set())

interface Transaction {
  _id: string;
  signature: string;
  activity_type: string;
  amount: string;
  blockTime: number;
  from: string;
  slot: number;
}

const handleNewTransactions = (transactions: Transaction[]) => {
  console.log('Yeni işlemler alındı:', transactions.length)

  if (visualizer.value && transactions.length > 0) {
    transactions.forEach(tx => {
      if (!processedTxIds.has(tx._id)) {
        console.log('İşleniyor:', tx._id)
        visualizer.value.handleNewTransaction(tx)
        processedTxIds.add(tx._id)
      }
    })
  }
}
</script>