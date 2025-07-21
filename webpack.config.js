const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './index.web.js',
  
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react',
              '@babel/preset-typescript'
            ],
            plugins: [
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-transform-runtime'
            ]
          }
        }
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: 'assets/[name].[ext]'
          }
        }
      }
    ]
  },
  
  resolve: {
    extensions: ['.web.js', '.js', '.jsx', '.ts', '.tsx'],
    alias: {
      'react-native$': 'react-native-web',
      'react-native-linear-gradient': 'react-native-web-linear-gradient',
      'react-native-vector-icons': 'react-native-vector-icons/dist',
    }
  },
  
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      title: 'Taxi Marne-la-Vallée - Réservation Disneyland Paris',
      meta: {
        'description': 'Application officielle Taxi Marne-la-Vallée. Réservation taxi Disneyland Paris, transport privé CDG Orly, estimation prix taxi rapide.',
        'keywords': 'taxi marne-la-vallée, réservation taxi disneyland, transport privé paris disney, taxi pas cher val europe',
        'viewport': 'width=device-width, initial-scale=1'
      }
    })
  ],
  
  devServer: {
    static: {
      directory: path.join(__dirname, 'public')
    },
    port: 3000,
    hot: true,
    open: true,
    historyApiFallback: true
  },
  
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/'
  }
};