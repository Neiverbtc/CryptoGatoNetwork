import { createConfig, http } from 'wagmi'
import { bscTestnet, bsc } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

// Configuración de chains soportadas
export const chains = [bscTestnet, bsc]

// Configuración de conectores de wallet
export const config = createConfig({
  chains,
  connectors: [
    injected(),
    walletConnect({
      projectId: 'your-project-id', // Se puede configurar después
      metadata: {
        name: 'CryptoGato DApp',
        description: 'Ecosistema DeFi CryptoGato',
        url: 'https://cryptogato.app',
        icons: ['https://cryptogato.app/icon.png']
      }
    })
  ],
  transports: {
    [bscTestnet.id]: http('https://data-seed-prebsc-1-s1.binance.org:8545'),
    [bsc.id]: http('https://bsc-dataseed1.binance.org')
  }
})

// Direcciones de contratos
export const CONTRACTS = {
  [bscTestnet.id]: {
    CRYPTOGATO_TOKEN: '0x487A001ce10215F5B9aC8827823e821C6E70CB66',
    CRYPTOGATO_PRESALE: '0x77A0C33A242CC4f4fAaA13A796423b79c25B5a1D',
    LIQUIDITY_CONNECTOR: '0xF308cbA0e89CaEbd325aE09BF9E19d142d9279CE'
  },
  [bsc.id]: {
    // Direcciones de mainnet cuando estén disponibles
    CRYPTOGATO_TOKEN: '',
    CRYPTOGATO_PRESALE: '',
    LIQUIDITY_CONNECTOR: ''
  }
}