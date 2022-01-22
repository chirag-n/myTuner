
class SoundProcessor extends AudioWorkletProcessor {
  constructor (...args) {
    super(...args);
    this.input_data = [];
  }

  process(inputs, outputs) {
    // const input = inputs[0];
    // const output = outputs[0];
    // for (let channel = 0; channel < output.length; ++channel) {
    //   const outputChannel = output[channel];
    //   const inputChannel = input[channel];
    //   for (let i = 0; i < inputChannel.length; ++i) {
    //     outputChannel[i] = inputChannel[i];
    //   }
    // }


    for (let i = 0; i < inputs[0][0].length; i++) {
      this.input_data.push(inputs[0][0][i])
    }

    if (this.input_data.length >= 16384) {
      this.port.postMessage(this.input_data);
      this.input_data = [];
    }
    return true
  }
}

registerProcessor('sound-processor', SoundProcessor);
